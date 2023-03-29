const assert = require("assert")
const qs = require("qs")
const tap = require("tap")
const q2s = require("../index")

tap.test("query-to-sequelize(query,{parser: qs}) =>", t1 => {
  t1.test(".criteria", t2 => {
    t2.test("should create criteria", t3 => {
      const results = q2s("foo[bar]=value", { parser: qs })
      assert.ok(results.criteria)
      assert.deepEqual(results.criteria, { foo: { bar: "value" } })
      t3.end()
    })

    t2.test("should create numeric criteria", t3 => {
      const results = q2s("foo[i]=10&foo[f]=1.2&foo[z]=0", { parser: qs })
      assert.ok(results.criteria)
      assert.deepEqual(results.criteria, { foo: { i: 10, f: 1.2, z: 0 } })
      t3.end()
    })

    t2.test("should not create numeric criteria", t3 => {
      const results = q2s("foo=5e8454301455190020332048", { parser: qs })
      assert.ok(results.criteria)
      assert.deepEqual(results.criteria, { foo: "5e8454301455190020332048" })
      t3.end()
    })
    t2.test("should create boolean criteria", t3 => {
      const results = q2s("foo[t]=true&foo[f]=false", { parser: qs })
      assert.ok(results.criteria)
      assert.deepEqual(results.criteria, { foo: { t: true, f: false } })
      t3.end()
    })
    t2.test("should create regex criteria", t3 => {
      const results = q2s("foo[r]=/regex/&foo[ri]=/regexi/i", { parser: qs })
      assert.ok(results.criteria)
      assert.deepEqual(results.criteria, { foo: { r: /regex/, ri: /regexi/i } })
      t3.end()
    })
    // can't create comparisons for embedded documents
    t2.test("shouldn't ignore deep criteria", t3 => {
      const results = q2s("field=value&foo[envelope]=true", { ignore: ["envelope"], parser: qs })
      assert.ok(results.criteria)
      assert.deepEqual(results.criteria, { field: "value", foo: { envelope: true } })
      t3.end()
    })
    t2.test("should create string criteria when forced with a quote", t3 => {
      const results = q2s("a='10'&b='11'&c='a,b'&d=10,11&z=\"that's all folks\"", { parser: qs })
      assert.ok(results.criteria)
      assert.deepEqual(results.criteria, { a: "10", b: "11", c: "a,b", d: { $in: [10, 11] }, z: "that's all folks" })
      t3.end()
    })

    t2.end()
  })

  t1.test(".options", t2 => {
    t2.test("should create paging options", t3 => {
      const results = q2s("offset=8&limit=16", { parser: qs })
      assert.ok(results.options)
      assert.deepEqual(results.options, { skip: 8, limit: 16 })
      t3.end()
    })
    t2.test("should create field option", t3 => {
      const results = q2s("fields=a,b,c", { parser: qs })
      assert.ok(results.options)
      assert.deepEqual(results.options, { fields: { a: 1, b: 1, c: 1 } })
      t3.end()
    })
    t2.test("should create sort option", t3 => {
      const results = q2s("sort=a,+b,-c", { parser: qs })
      assert.ok(results.options)
      assert.deepEqual(results.options, { sort: { a: 1, b: 1, c: -1 } })
      t3.end()
    })
    t2.test("should limit queries", t3 => {
      const results = q2s("limit=100", { maxLimit: 50, parser: qs })
      assert.ok(results.options)
      assert.deepEqual(results.options, { limit: 50 })
      t3.end()
    })
    t2.end()
  })

  t1.test("#links", t2 => {
    const links = q2s("foo[bar]=baz&offset=20&limit=10", { maxLimit: 50, parser: qs }).links("http://localhost", 100)
    t2.test("should create first link", t3 => {
      assert.equal(links.first, "http://localhost?foo%5Bbar%5D=baz&offset=0&limit=10")
      t3.end()
    })
    t2.test("should create prev link", t3 => {
      assert.equal(links.prev, "http://localhost?foo%5Bbar%5D=baz&offset=10&limit=10")
      t3.end()
    })
    t2.test("should create next link", t3 => {
      assert.equal(links.next, "http://localhost?foo%5Bbar%5D=baz&offset=30&limit=10")
      t3.end()
    })
    t2.test("should create last link", t3 => {
      assert.equal(links.last, "http://localhost?foo%5Bbar%5D=baz&offset=90&limit=10")
      t3.end()
    })
    t2.end()
  })
  t1.end()
})
