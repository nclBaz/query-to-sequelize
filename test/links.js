const assert = require("assert")
const tap = require("tap")
const q2s = require("../index")

tap.test("query-to-sequelize(query).links =>", t1 => {
  t1.test("#links", t2 => {
    const links = q2s("offset=20&limit=10").links("http://localhost", 95)
    t2.test("should create first link", t3 => {
      assert.equal(links.first, "http://localhost?offset=0&limit=10")
      t3.end()
    })
    t2.test("should create prev link", t3 => {
      assert.equal(links.prev, "http://localhost?offset=10&limit=10")
      t3.end()
    })
    t2.test("should create next link", t3 => {
      assert.equal(links.next, "http://localhost?offset=30&limit=10")
      t3.end()
    })
    t2.test("should create last link", t3 => {
      assert.equal(links.last, "http://localhost?offset=90&limit=10")
      t3.end()
    })
    t2.end()
  })

  t1.test("with no pages", t2 => {
    const links = q2s("offset=0&limit=100").links("http://localhost", 95)
    t2.test("should not create links", t3 => {
      assert.ok(!links.first)
      assert.ok(!links.last)
      assert.ok(!links.next)
      assert.ok(!links.prev)
      t3.end()
    })
    t2.end()
  })

  t1.test("when on first page", t2 => {
    const links = q2s("offset=0&limit=10").links("http://localhost", 95)
    t2.test("should not create prev link", t3 => {
      assert.ok(!links.prev)
      t3.end()
    })
    t2.test("should not create first link", t3 => {
      assert.ok(!links.first)
      t3.end()
    })
    t2.test("should create next link", t3 => {
      assert.equal(links.next, "http://localhost?offset=10&limit=10")
      t3.end()
    })
    t2.test("should create last link", t3 => {
      assert.equal(links.last, "http://localhost?offset=90&limit=10")
      t3.end()
    })
    t2.end()
  })

  t1.test("when on last page", t2 => {
    const links = q2s("offset=90&limit=10").links("http://localhost", 95)
    t2.test("should not create next link", t3 => {
      assert.ok(!links.next)
      t3.end()
    })
    t2.test("should not create last link", t3 => {
      assert.ok(!links.last)
      t3.end()
    })
    t2.test("should create prev link", t3 => {
      assert.equal(links.prev, "http://localhost?offset=80&limit=10")
      t3.end()
    })
    t2.test("should not create first link", t3 => {
      assert.equal(links.first, "http://localhost?offset=0&limit=10")
      t3.end()
    })
    t2.end()
  })

  t1.end()
})
