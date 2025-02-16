const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  let firstStock = 'AAPL';
  let secondStock = 'GOOG';

  test('Viewing one stock', function(done) {
    chai.request(server)
      .get(`/api/stock-prices`)
      .query({ stock: firstStock })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.property(res.body.stockData, 'stock');
        assert.property(res.body.stockData, 'price');
        assert.property(res.body.stockData, 'likes');
        done();
      });
  });

  test('Viewing one stock and liking it', function(done) {
    chai.request(server)
      .get(`/api/stock-prices`)
      .query({ stock: firstStock, like: true })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.property(res.body.stockData, 'likes');
        done();
      });
  });

  test('Viewing the same stock and liking it again', function(done) {
    chai.request(server)
      .get(`/api/stock-prices`)
      .query({ stock: firstStock, like: true })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.isAtLeast(res.body.stockData.likes, 1);
        done();
      });
  });

  test('Viewing two stocks', function(done) {
    chai.request(server)
      .get(`/api/stock-prices`)
      .query({ stock: [firstStock, secondStock] })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body.stockData);
        assert.property(res.body.stockData[0], 'stock');
        assert.property(res.body.stockData[1], 'stock');
        done();
      });
  });

  test('Viewing two stocks and liking them', function(done) {
    chai.request(server)
      .get(`/api/stock-prices`)
      .query({ stock: [firstStock, secondStock], like: true })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body.stockData);
        assert.property(res.body.stockData[0], 'rel_likes');
        assert.property(res.body.stockData[1], 'rel_likes');
        done();
      });
  });
});
