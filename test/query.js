const assert = require("assert")
const qs = require("qs")
const tap = require("tap")
const { Op } = require("sequelize")
const q2s = require("../index")

tap.test("query-to-sequelize(query) =>", t1 => {
  t1.test(".criteria", t2 => {
    t2.test("should create criteria", t3 => {
      const results = q2s("field=value")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { field: "value" })
      t3.end()
    })
    t2.test("should create numeric criteria", t3 => {
      const results = q2s("i=10&f=1.2&z=0")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { i: 10, f: 1.2, z: 0 })
      t3.end()
    })
    t2.test("should not create numeric criteria", t3 => {
      const results = q2s("foo=5e8454301455190020332048")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { foo: "5e8454301455190020332048" })
      t3.end()
    })
    t2.test("should create boolean criteria", t3 => {
      const results = q2s("t=true&f=false")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { t: true, f: false })
      t3.end()
    })
    t2.test("should create regex criteria", t3 => {
      const results = q2s("r=/regex/&ri=/regexi/i")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { r: { [Op.regexp]: /regex/ }, ri: { [Op.regexp]: /regexi/i } })
      t3.end()
    })
    t2.test("should create regex criteria with comma", t3 => {
      const results = q2s("r=/reg,ex/&ri=/reg,exi/i")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { r: { [Op.regexp]: /reg,ex/ }, ri: { [Op.regexp]: /reg,exi/i } })
      t3.end()
    })
    t2.test("should create Date criteria from YYYY-MM", t3 => {
      const results = q2s("d=2010-04")
      assert.ok(results.criteria)
      assert.ok(results.criteria.d instanceof Date, "instanceof Date")
      assert.deepStrictEqual(results.criteria, { d: new Date(Date.UTC(2010, 3, 1)) })
      t3.end()
    })
    t2.test("should create Date criteria from YYYY-MM-DD", t3 => {
      const results = q2s("d=2010-04-01")
      assert.ok(results.criteria)
      assert.ok(results.criteria.d instanceof Date, "instanceof Date")
      assert.deepStrictEqual(results.criteria, { d: new Date(Date.UTC(2010, 3, 1)) })
      t3.end()
    })
    t2.test("should create Date criteria from YYYY-MM-DDThh:mmZ", t3 => {
      const results = q2s("d=2010-04-01T12:00Z")
      assert.ok(results.criteria)
      assert.ok(results.criteria.d instanceof Date, "instanceof Date")
      assert.deepStrictEqual(results.criteria, { d: new Date(Date.UTC(2010, 3, 1, 12, 0)) })
      t3.end()
    })
    t2.test("should create Date criteria from YYYY-MM-DDThh:mm:ssZ", t3 => {
      const results = q2s("d=2010-04-01T12:00:30Z")
      assert.ok(results.criteria)
      assert.ok(results.criteria.d instanceof Date, "instanceof Date")
      assert.deepStrictEqual(results.criteria, { d: new Date(Date.UTC(2010, 3, 1, 12, 0, 30)) })
      t3.end()
    })
    t2.test("should create Date criteria from YYYY-MM-DDThh:mm:ss.sZ", t3 => {
      const results = q2s("d=2010-04-01T12:00:30.250Z")
      assert.ok(results.criteria)
      assert.ok(results.criteria.d instanceof Date, "instanceof Date")
      assert.deepStrictEqual(results.criteria, { d: new Date(Date.UTC(2010, 3, 1, 12, 0, 30, 250)) })
      t3.end()
    })
    t2.test("should create Date criteria from YYYY-MM-DDThh:mm:ss.s-hh:mm", t3 => {
      const results = q2s("d=2010-04-01T11:00:30.250-01:00")
      assert.ok(results.criteria)
      assert.ok(results.criteria.d instanceof Date, "instanceof Date")
      assert.deepStrictEqual(results.criteria, { d: new Date(Date.UTC(2010, 3, 1, 12, 0, 30, 250)) })
      t3.end()
    })
    t2.test("should create Date criteria from YYYY-MM-DDThh:mm:ss.s+hh:mm", t3 => {
      const results = q2s(encodeURIComponent("d=2010-04-01T13:00:30.250+01:00"))
      assert.ok(results.criteria)
      assert.ok(results.criteria.d instanceof Date, "instanceof Date")
      assert.deepStrictEqual(results.criteria, { d: new Date(Date.UTC(2010, 3, 1, 12, 0, 30, 250)) })
      t3.end()
    })
    t2.test("should create [Op.gt] criteria", t3 => {
      const results = q2s("field>value")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { field: { [Op.gt]: "value" } })
      t3.end()
    })
    t2.test("should create [Op.lt] criteria", t3 => {
      const results = q2s("field<value")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { field: { [Op.lt]: "value" } })
      t3.end()
    })
    t2.test("should create [Op.gte] criteria", t3 => {
      const results = q2s("field>=value")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { field: { [Op.gte]: "value" } })
      t3.end()
    })
    t2.test("should create [Op.lte] criteria", t3 => {
      const results = q2s("field<=value")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { field: { [Op.lte]: "value" } })
      t3.end()
    })
    t2.test("should create [Op.ne] criteria", t3 => {
      const results = q2s("field!=value")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { field: { [Op.ne]: "value" } })
      t3.end()
    })
    t2.test("should create [Op.not] criteria", t3 => {
      const results = q2s("field!=/.*value*./i")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { field: { [Op.not]: /.*value*./i } })
      t3.end()
    })

    t2.test("should create [Op.gt] criteria from value", t3 => {
      const results = q2s("field=%3Evalue")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { field: { [Op.gt]: "value" } })
      t3.end()
    })
    t2.test("should create [Op.lt] criteria from value", t3 => {
      const results = q2s("field=%3Cvalue")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { field: { [Op.lt]: "value" } })
      t3.end()
    })
    t2.test("should create [Op.gte] criteria from value", t3 => {
      const results = q2s("field=%3E%3Dvalue")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { field: { [Op.gte]: "value" } })
      t3.end()
    })
    t2.test("should create [Op.lte] criteria from value", t3 => {
      const results = q2s("field=%3C%3Dvalue")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { field: { [Op.lte]: "value" } })
      t3.end()
    })
    t2.test("should create [Op.ne] criteria from value", t3 => {
      const results = q2s("field=%21%3Dvalue")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { field: { [Op.ne]: "value" } })
      t3.end()
    })
    t2.test("should create [Op.not] criteria from /.*value*./i", t3 => {
      const results = q2s("field=%21%3D/.*value*./i")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { field: { [Op.not]: /.*value*./i } })
      t3.end()
    })
    t2.test("should create [Op.ne] criteria from !value", t3 => {
      const results = q2s("field=%21value")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { field: { [Op.ne]: "value" } })
      t3.end()
    })
    t2.test("should create [Op.notIn] criteria from multiple !value", t3 => {
      const results = q2s("field=%21a&field=%21b")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { field: { [Op.notIn]: ["a", "b"] } })
      t3.end()
    })
    t2.test("should create [Op.not] criteria from !/.*value*./i", t3 => {
      const results = q2s("field=%21/.*value*./i")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { field: { [Op.not]: /.*value*./i } })
      t3.end()
    })

    t2.test("should create [Op.in] criteria", t3 => {
      const results = q2s("field=a&field=b")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { field: { [Op.in]: ["a", "b"] } })
      t3.end()
    })
    t2.test("should create [Op.notIn] criteria", t3 => {
      const results = q2s("field!=a&field!=b")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { field: { [Op.notIn]: ["a", "b"] } })
      t3.end()
    })
    t2.test("should create mixed criteria", t3 => {
      const results = q2s("field!=10&field!=20&field>3")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { field: { [Op.notIn]: [10, 20], [Op.gt]: 3 } })
      t3.end()
    })
    t2.test("should create range criteria", t3 => {
      const results = q2s("field>=10&field<=20")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { field: { [Op.gte]: 10, [Op.lte]: 20 } })
      t3.end()
    })
    t2.test("should ignore criteria", t3 => {
      const results = q2s("field=value&envelope=true&&offset=0&limit=10&fields=id&sort=name", { ignore: ["envelope"] })
      assert.ok(results.criteria)
      assert.ok(!results.criteria.envelope, "envelope")
      assert.ok(!results.criteria.skip, "offset")
      assert.ok(!results.criteria.limit, "limit")
      assert.ok(!results.criteria.fields, "fields")
      assert.ok(!results.criteria.sort, "sort")
      assert.deepStrictEqual(results.criteria, { field: "value" })
      t3.end()
    })
    t2.test("should create [Op.is] criteria or [Op.not] from value", t3 => {
      const results = q2s("a=&b=%21")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { a: { [Op.not]: null }, b: { [Op.is]: null } })
      t3.end()
    })
    t2.test("should create [Op.not] null criteria", t3 => {
      const results = q2s("a&b=10&c", { ignore: ["c"] })
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { a: { [Op.not]: null }, b: 10 })
      t3.end()
    })
    t2.test("should create [Op.is] null criteria", t3 => {
      const results = q2s("!a&b=10&c", { ignore: ["c"] })
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { a: { [Op.is]: null }, b: 10 })
      t3.end()
    })
    // t2.test("should create $type criteria with BSON type number", t3 => {
    //   const results = q2s("field:type=2")
    //   assert.ok(results.criteria)
    //   assert.deepStrictEqual(results.criteria, { field: { $type: 2 } })
    //   t3.end()
    // })
    // t2.test("should create $type criteria with BSON type name", t3 => {
    //   const results = q2s("field:type=string")
    //   assert.ok(results.criteria)
    //   assert.deepStrictEqual(results.criteria, { field: { $type: "string" } })
    //   t3.end()
    // })
    // t2.test("should create $size criteria", t3 => {
    //   const results = q2s("array:size=2")
    //   assert.ok(results.criteria)
    //   assert.deepStrictEqual(results.criteria, { array: { $size: 2 } })
    //   t3.end()
    // })
    // t2.test("should create $all criteria", t3 => {
    //   const results = q2s("array:all=50,60")
    //   assert.ok(results.criteria)
    //   assert.deepStrictEqual(results.criteria, { array: { $all: [50, 60] } })
    //   t3.end()
    // })
    t2.test("should create forced string criteria", t3 => {
      const results = q2s("s='a,b'")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { s: "a,b" })
      t3.end()
    })
    t2.test("should create numeric criteria from YYYY exception", t3 => {
      const results = q2s("d=2016")
      assert.ok(results.criteria)
      assert.deepStrictEqual(results.criteria, { d: 2016 })
      t3.end()
    })

    t2.end()
  })

  t1.test(".options", t2 => {
    t2.test("should create paging options", t3 => {
      const results = q2s("offset=8&limit=16")
      assert.ok(results.options)
      assert.deepStrictEqual(results.options, { skip: 8, limit: 16 })
      t3.end()
    })
    t2.test("should create field option", t3 => {
      const results = q2s("fields=a,b,c")
      assert.ok(results.options)
      assert.deepStrictEqual(results.options, { fields: ["a", "b", "c"] })
      t3.end()
    })
    t2.test("should create omit option", t3 => {
      const results = q2s("omit=b")
      assert.ok(results.options)
      assert.deepStrictEqual(results.options, { fields: { exclude: ["b"] } })
      t3.end()
    })
    t2.test("should create sort option", t3 => {
      const results = q2s("sort=a,+b,-c")
      assert.ok(results.options)
      assert.deepStrictEqual(results.options, {
        sort: [
          ["a", "ASC"],
          ["b", "ASC"],
          ["c", "DESC"],
        ],
      })
      t3.end()
    })
    t2.test("should limit queries", t3 => {
      const results = q2s("limit=100", { maxLimit: 50 })
      assert.ok(results.options)
      assert.deepStrictEqual(results.options, { limit: 50 })
      t3.end()
    })

    t2.end()
  })

  t1.test(".options (altKeywords)", t2 => {
    t2.test("should create paging options", t3 => {
      const altKeywords = { fields: "$fields", offset: "$offset", limit: "$limit", sort: "$sort", omit: "$omit" }
      const results = q2s("$offset=8&$limit=16", { keywords: altKeywords })
      assert.ok(results.options)
      assert.deepStrictEqual(results.options, { skip: 8, limit: 16 })
      t3.end()
    })
    t2.test("should create field option", t3 => {
      const altKeywords = { fields: "$fields", offset: "$offset", limit: "$limit", sort: "$sort", omit: "$omit" }
      const results = q2s("$fields=a,b,c", { keywords: altKeywords })
      assert.ok(results.options)
      assert.deepStrictEqual(results.options, { fields: ["a", "b", "c"] })
      t3.end()
    })
    t2.test("should create omit option", t3 => {
      const altKeywords = { fields: "$fields", offset: "$offset", limit: "$limit", sort: "$sort", omit: "$omit" }
      const results = q2s("$omit=b", { keywords: altKeywords })
      assert.ok(results.options)
      assert.deepStrictEqual(results.options, { fields: { exclude: ["b"] } })
      t3.end()
    })
    t2.test("should create sort option", t3 => {
      const altKeywords = { fields: "$fields", offset: "$offset", limit: "$limit", sort: "$sort", omit: "$omit" }
      const results = q2s("$sort=a,+b,-c", { keywords: altKeywords })
      assert.ok(results.options)
      assert.deepStrictEqual(results.options, {
        sort: [
          ["a", "ASC"],
          ["b", "ASC"],
          ["c", "DESC"],
        ],
      })
      t3.end()
    })
    t2.test("should limit queries", t3 => {
      const altKeywords = { fields: "$fields", offset: "$offset", limit: "$limit", sort: "$sort", omit: "$omit" }
      const results = q2s("$limit=100", { maxLimit: 50, keywords: altKeywords })
      assert.ok(results.options)
      assert.deepStrictEqual(results.options, { limit: 50 })
      t3.end()
    })
    t2.end()
  })

  t1.end()
})
