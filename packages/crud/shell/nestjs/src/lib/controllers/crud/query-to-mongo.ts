import * as querystring from 'querystring';
const iso8601 =
  /^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12][0-9]|3[01]))?)?(T([01][0-9]|2[0-3]):[0-5]\d(:[0-5]\d(\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?$/;

// Convert comma separated list to a mongo projection.
// for example f('field1,field2,field3') -> {field1:true,field2:true,field3:true}
function fieldsToMongo(fields) {
  if (!fields) return null;
  const hash = {};
  fields.split(',').forEach(function (field) {
    hash[field.trim()] = 1;
  });
  return hash;
}

function convertRegex(val: string): string {
  return val.toString().replace(/\*/g, '[*]');
}

// Convert comma separated list to a mongo projection which specifies fields to omit.
// for example f('field2') -> {field2:false}
function omitFieldsToMongo(omitFields) {
  if (!omitFields) return null;
  const hash = {};
  omitFields.split(',').forEach(function (omitField) {
    hash[omitField.trim()] = 0;
  });
  return hash;
}

// Convert comma separated list to mongo sort options.
// for example f('field1,+field2,-field3') -> {field1:1,field2:1,field3:-1}
function sortToMongo(sort) {
  if (!sort) return null;
  const hash = {};
  let c;
  sort.split(',').forEach(function (field) {
    c = field.charAt(0);
    if (c === '-') field = field.substr(1);
    hash[field.trim()] = c === '-' ? -1 : 1;
  });
  return hash;
}

// Convert String to Number, Date, or Boolean if possible. Also strips ! prefix
function typedValue(value) {
  if (value[0] === '!') value = value.substr(1);
  const regex = value.match(/^\/(.*)\/(i?)$/);
  const quotedString = value.match(/(["'])(?:\\\1|.)*?\1/);

  if (regex) {
    return new RegExp(regex[1], regex[2]);
  } else if (quotedString) {
    return quotedString[0].substr(1, quotedString[0].length - 2);
  } else if (value === 'true') {
    return true;
  } else if (value === 'false') {
    return false;
  } else if (iso8601.test(value) && value.length !== 4 && value.length !== 10) {
    return new Date(value);
  } else if (!isNaN(Number(value))) {
    return Number(value);
  }

  return value;
}

// Convert a comma separated string value to an array of values.  Commas
// in a quoted strings and regexes are ignored.  Also strips ! prefix from values.
function typedValues(svalue) {
  const commaSplit = /("[^"]*")|('[^']*')|(\/[^/]*\/i?)|([^,]+)/g;
  const values = [];
  svalue.match(commaSplit).forEach(function (value) {
    values.push(typedValue(value));
  });
  return values;
}

// Convert a key/value pair split at an equals sign into a mongo comparison.
// Converts value Strings to Numbers or Booleans when possible.
// for example:
// + f('key','value') => {key:'key',value:'value'}
// + f('key>','value') => {key:'key',value:{$gte:'value'}}
// + f('key') => {key:'key',value:{$exists: true}}
// + f('!key') => {key:'key',value:{$exists: false}}
// + f('key:op','value') => {key: 'key', value:{ $op: value}}
// + f('key','op:value') => {key: 'key', value:{ $op: value}}
function comparisonToMongo(key, value) {
  const join = value === '' ? key : key.concat('=', value);
  const parts = join.match(/^(!?[^><~!=:]+)(?:=?([><]=?|~?=|!?=|:.+=)(.+))?$/);
  let op;
  const hash = {} as any;
  if (!parts) return null;

  key = parts[1];
  op = parts[2];

  if (!op) {
    if (key[0] !== '!') value = { $exists: true };
    else {
      key = key.substr(1);
      value = { $exists: false };
    }
  } else if (op === '=' && parts[3] === '!') {
    value = { $exists: false };
  } else if (op === '=' || op === '!=') {
    if (op === '=' && parts[3][0] === '!') op = '!=';
    // tslint:disable-next-line:no-shadowed-variable
    const array = typedValues(parts[3]);
    if (array.length > 1) {
      value = {};
      op = op === '=' ? '$in' : '$nin';
      value[op] = array;
    } else if (op === '!=') {
      value =
        array[0] instanceof RegExp ? { $not: array[0] } : { $ne: array[0] };
    } else if (array[0][0] === '!') {
      const sValue = array[0].substr(1);
      const regex = sValue.match(/^\/(.*)\/(i?)$/);
      value = regex
        ? { $not: new RegExp(regex[1], regex[2]) }
        : { $ne: sValue };
    } else {
      value = array[0];
    }
  } else if (op[0] === ':' && op[op.length - 1] === '=') {
    op = '$' + op.substr(1, op.length - 2);
    const array = [];
    // tslint:disable-next-line:no-shadowed-variable
    parts[3].split(',').forEach(function (value) {
      array.push(typedValue(value));
    });
    value = {};
    value[op] = array.length === 1 ? array[0] : array;
  } else {
    value = typedValue(parts[3]);
    if (op === '>') value = { $gt: value };
    else if (op === '>=') value = { $gte: value };
    else if (op === '<') value = { $lt: value };
    else if (op === '<=') value = { $lte: value };
    else if (op === '~=')
      value = {
        $regex: value ? convertRegex(value) : '',
        $options: 'i',
      };
  }

  hash.key = key;
  hash.value = value;
  return hash;
}

// Checks for keys that are ordinal positions, such as {'0':'one','1':'two','2':'three'}
function hasOrdinalKeys(obj) {
  let c = 0;
  for (const key in obj) {
    if (Number(key) !== c++) return false;
  }
  return true;
}

// Convert query parameters to a mongo query criteria.
// for example {field1:"red","field2>2":""} becomes {field1:"red",field2:{$gt:2}}
function queryCriteriaToMongo(query, options = null) {
  const hash = {};
  let deep, p;
  options = options || {};

  for (const key in query) {
    if (
      Object.prototype.hasOwnProperty.call(query, key) &&
      (!options.ignore || options.ignore.indexOf(key) === -1)
    ) {
      deep = typeof query[key] === 'object' && !hasOrdinalKeys(query[key]);

      if (deep) {
        p = {
          key: key,
          value: queryCriteriaToMongo(query[key]),
        };
      } else {
        p = comparisonToMongo(key, query[key]);
      }

      if (p) {
        if (!hash[p.key]) {
          hash[p.key] = p.value;
        } else if (typeof p.value === 'string') {
          hash[p.key] = Object.assign(hash[p.key], {
            $eq: p.value,
          });
        } else {
          hash[p.key] = Object.assign(hash[p.key], p.value);
        }
      }
    }
  }
  return hash;
}

// Convert query parameters to a mongo query options.
// for example {fields:'a,b',offset:8,limit:16} becomes {fields:{a:true,b:true},skip:8,limit:16}
function queryOptionsToMongo(query, options) {
  const hash = {} as any,
    fields = fieldsToMongo(query[options.keywords.fields]),
    omitFields = omitFieldsToMongo(query[options.keywords.omit]),
    sort = sortToMongo(query[options.keywords.sort]),
    maxLimit = options.maxLimit || 9007199254740992;

  let limit = options.maxLimit || 0;

  if (fields) hash.fields = fields;
  // omit intentionally overwrites fields if both have been specified in the query
  // mongo does not accept mixed true/fals field specifiers for projections
  if (omitFields) hash.fields = omitFields;
  if (sort) hash.sort = sort;

  if (query[options.keywords.offset])
    hash.skip = Number(query[options.keywords.offset]);
  if (query[options.keywords.limit])
    limit = Math.min(Number(query[options.keywords.limit]), maxLimit);
  if (limit) {
    hash.limit = limit;
  } else if (options.maxLimit) {
    hash.limit = maxLimit;
  }

  return hash;
}

export function q2m(query = null, options = null) {
  query = query || {};
  options = options || {};
  options.keywords = options.keywords || {};

  const defaultKeywords = {
    fields: 'fields',
    omit: 'omit',
    sort: 'sort',
    offset: 'offset',
    limit: 'limit',
  };
  options.keywords = Object.assign(defaultKeywords, options.keywords);
  const ignoreKeywords = [
    options.keywords.fields,
    options.keywords.omit,
    options.keywords.sort,
    options.keywords.offset,
    options.keywords.limit,
  ];

  if (!options.ignore) {
    options.ignore = [];
  } else {
    options.ignore =
      typeof options.ignore === 'string' ? [options.ignore] : options.ignore;
  }
  options.ignore = options.ignore.concat(ignoreKeywords);
  if (!options.parser) options.parser = querystring;

  if (typeof query === 'string') query = options.parser.parse(query);

  return {
    criteria: queryCriteriaToMongo(query, options),
    options: queryOptionsToMongo(query, options),

    links: function (url, totalCount) {
      const offset = this.options.skip || 0;
      const limit = Math.min(this.options.limit || 0, totalCount);
      const links = {};
      const last = {} as any;

      if (!limit) return null;

      options = options || {};

      if (offset > 0) {
        query[options.keywords.offset] = Math.max(offset - limit, 0);
        links['prev'] = url + '?' + options.parser.stringify(query);
        query[options.keywords.offset] = 0;
        links['first'] = url + '?' + options.parser.stringify(query);
      }
      if (offset + limit < totalCount) {
        last.pages = Math.ceil(totalCount / limit);
        last.offset = (last.pages - 1) * limit;

        query[options.keywords.offset] = Math.min(offset + limit, last.offset);
        links['next'] = url + '?' + options.parser.stringify(query);
        query[options.keywords.offset] = last.offset;
        links['last'] = url + '?' + options.parser.stringify(query);
      }
      return links;
    },
  };
}
