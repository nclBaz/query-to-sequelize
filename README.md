# query-to-sequelize

Node.js package to convert query parameters into a [sequelize](https://sequelize.org/) query criteria and options

For example, a query such as: `name=john&age>21&fields=name,age&sort=name,-age&offset=10&limit=10` becomes the following hash:

```javascript
{
  criteria: { name: 'john', age: { [Op.gt]: 21 } },
  options: {
    fields: [ 'name', 'age' ],
    sort: [ [ 'name', 'ASC' ], [ 'age', 'DESC' ] ],
    skip: 10,
    limit: 10
  }
}
```

The resulting query object can be used as parameters for a sequelize query:

```javascript
const q2s = require('query-to-sequelize')
const { Sequelize, DataTypes } = require('sequelize')

const sequelize = new Sequelize(PG_DB, PG_USER, PG_PASSWORD, {host: PG_HOST, port: PG_PORT, dialect: "postgres"})
await sequelize.authenticate()

const Model = sequelize.define("model", { name: {type: DataTypes: STRING}, age: {type: DataTypes.INTEGER}})

const {criteria, options} = q2s('name=john&age>13&limit=20&skip=40&sort=-name')

await Model.findAll({where: criteria, limit: options.limit, offset: options.skip, order: options.sort})

```

Comparision operators that are encoded into the value are also considered. For example, a query sucha as: `name=john&age=%3E21` becomes the following hash:

```javascript
{
  criteria: {
    name: 'john',
    age: { [Op.gt]: 21 }
  }
}
```

## API

### queryToSequelize(query, options)

Convert the query portion of a url to a sequelize query.

```javascript
const queryToSequelize = require("query-to-sequelize")
const query = queryToSequelize("name=john&age>21&limit=10")
console.log(query)
```

```javascript
{ criteria: { name: 'john', age: { [Op.gt]: 21 } },
  options: { limit: 10 },
  links: [Function] }
```

#### options:

- **maxLimit** The maximum limit (default is none)
- **ignore** List of criteria to ignore in addition to keywords used for query options ("fields", "omit", "sort", "offset", "limit")
- **parser** Query parser to use instead of _querystring_. Must implement `parse(string)` and `stringify(obj)`.
- **keywords** Override the keywords used for query options ("fields", "omit", "sort", "skip", "limit"). For example: `{fields:'$fields', omit:'$omit', sort:'$sort', offset:'$skip', limit:'$limit'}` <-- TODO

#### returns:

- **criteria** Sequelize query criteria.
- **options** Sequelize query options.
- **links** Function to calculate relative links.

##### links(url, totalCount)

Calculate relative links given the base url and totalCount. Can be used to populate the [express response links](http://expressjs.com/4x/api.html#res.links).

```javascript
const q2s = require("query-to-sequelize")
const query = q2s("name=john&age>21&offset=20&limit=10")
console.log(query.links("http://localhost/api/v1/users", 100))
```

```javascript
{ prev: 'http://localhost/api/v1/users?name=john&age%3E21=&offset=10&limit=10',
  first: 'http://localhost/api/v1/users?name=john&age%3E21=&offset=0&limit=10',
  next: 'http://localhost/api/v1/users?name=john&age%3E21=&offset=30&limit=10',
  last: 'http://localhost/api/v1/users?name=john&age%3E21=&offset=90&limit=10' }
```

## Use

The module is intended for use by express routes, and so takes a parsed query as input:

```
const querystring = require('querystring')
const q2s = require('query-to-sequelize')
const query = 'name=john&age>21&fields=name,age&sort=name,-age&offset=10&limit=10'
const q = q2s(querystring.parse(query))
```

This makes it easy to use in an express route:

```
router.get('/api/v1/mycollection', function(req, res, next) {
  const q = q2s(res.query);
  ...
}
```

The format for arguments was inspired by item #7 in [this article](http://blog.mwaysolutions.com/2014/06/05/10-best-practices-for-better-restful-api/) about best practices for RESTful APIs.

### Field selection

The _fields_ argument is a comma separated list of field names to include in the results. For example `fields=name,age` results in a _option.fields_ value of `[ 'name', 'age' ]`. If no fields are specified then _option.fields_ is null, returning full documents as results.

The _omit_ argument is a comma separated list of field names to exclude in the results. For example `omit=name,age` results in a _option.fields_ value of `{ exclude: [ 'name', 'age' ] }`. If no fields are specified then _option.fields_ is null, returning full documents as results.

Note that either _fields_ or _omit_ can be used. If both are specified then _omit_ takes precedence and the _fields_ entry is ignored.

### Sorting

The _sort_ argument is a comma separated list of fields to sort the results by. For example `sort=name,-age` results in a _option.sort_ value of `[ [ 'name', 'ASC' ], [ 'age', 'DESC' ] ]`. If no sort is specified then _option.sort_ is null and the results are not sorted.

### Paging

The _offset_ and _limit_ arguments indicate the subset of the full results to return. By default, the full results are returned. If _limit_ is set and the total count is obtained for the query criteria, pagination links can be generated:

```
  const { count, rows } = await Model.findAndCountAll({limit, offset})
  const links = q.links('http://localhost/api/v1/mycollection', count)

```

For example, if _offset_ was 20, _limit_ was 10, and _count_ was 95, the following links would be generated:

```
{
   'prev': 'http://localhost/api/v1/mycollection?offset=10&limit=10',
   'first': `http://localhost/api/v1/mycollection?offset=0&limit=10`,
   'next': 'http://localhost/api/v1/mycollection?offset=30&limit=10',
   'last': 'http://localhost/api/v1/mycollection?offset=90&limit=10'
}
```

These pagination links can be used to populate the [express response links](http://expressjs.com/4x/api.html#res.links).

### Filtering

Any query parameters other then the keywords _fields_, _omit_, _sort_, _offset_, and _limit_ are interpreted as query criteria. For example `name=john&age>21` results in a _criteria_ value of:

```
{ name: 'john', age: { [Op.gt]: 21 } }
```

- Supports standard comparison operations (=, !=, >, <, >=, <=).
- Numeric values, where `Number(value) != NaN`, are compared as numbers (ie., `field=10` yields `{field:10}`).
- Values of _true_ and _false_ are compared as booleans (ie., `{field:true}`)
- Values that are [dates](http://www.w3.org/TR/NOTE-datetime) are compared as dates (except for YYYY which matches the number rule).
- Multiple equals comparisons are merged into a `[Op.in]` operator. For example, `id=a&id=b` yields `{id: { [Op.in]: [ 'a', 'b' ] }}`.
- Multiple not-equals comparisons are merged into a `[Op.notIn]` operator. For example, `id!=a&id!=b` yields `{id:{[Op.notIn]: ['a','b']}}`.
- Comma separated values in equals or not-equals yield an `[Op.in]` or `[Op.notIn]` operator. For example, `id=a,b` yields `{id:{[Op.in]: ['a','b']}}`.
- Regex patterns. For example, `name=/^john/i` yields `{id: /^john/i}`.
- Parameters without a value check that the field is present. For example, `foo&bar=10` yields `{foo: {$exists: true}, bar: 10}`.
- Parameters prefixed with a _not_ (!) and without a value check that the field is not present. For example, `!foo&bar=10` yields `{foo: {$exists: false}, bar: 10}`.
- Supports some of the named comparision operators ($type, $size and $all).  For example, `foo:type=string`, yeilds `{ foo: {$type: 'string} }`.
- Support for forced string comparison; value in single or double quotes (`field='10'` or `field="10"`) would force a string compare. Allows for string with embedded comma (`field="a,b"`) and quotes (`field="that's all folks"`).

### A note on embedded documents

Comparisons on embedded documents should use mongo's [dot notation](http://docs.mongodb.org/manual/reference/glossary/#term-dot-notation) instead of express's 'extended' [query parser](https://www.npmjs.com/package/qs) (Use `foo.bar=value` instead of `foo[bar]=value`).

Although exact matches are handled for either method, comparisons (such as `foo[bar]!=value`) are not supported because the 'extended' parser expects an equals sign after the nested object reference; if it's not an equals the remainder is discarded.

### A note on overriding keywords

You can adjust the keywords (_fields_, _omit_, _sort_, _offset_, and _limit_) by providing an alternate set as an option. For example:

```
altKeywords = {fields:'$fields', omit:'$omit', sort:'$sort', offset:'$offset', limit:'$limit'}
var q = q2m(res.query, {keywords: altKeywords});
```

This will then interpret the standard keywords as query parameters instead of options. For example a query of `age>21&omit=false&$omit=a` results in a _criteria_ value of:

```
{
  'age': { $gt: 21 },
  'omit': false
}
```

and an _option_ value of:

```
q.option = {
  fields: { a: false }
}
```

## Development

There's a _test_ script listed in package.json that will execute the mocha tests:

```
npm install
npm test
```

## Todo

- Geospatial search
- $text searches
- $mod comparision
- Bitwise comparisions
- Escaping or double quoting in forced string comparison, ='That\'s all folks' or ='That''s all folks'

## Creating a Release

1. Ensure all unit tests pass with `npm test`
2. Use `npm version major|minor|patch` to increment the version in _package.json_ and tag the release
3. Push the tags `git push origin master --tags`
4. Publish the release `npm publish ./`

### Major Release

    npm version major
    git push origin master --tags
    npm publish ./

### Minor Release (backwards compatible changes)

    npm version minor
    git push origin master --tags
    npm publish ./

### Patch Release (bug fix)

    npm version patch
    git push origin master --tags
    npm publish ./
