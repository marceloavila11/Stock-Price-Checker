'use strict';
const axios = require('axios');
const crypto = require('crypto'); // Para anonimizar IPs
let stocksLikes = {}; // { stockSymbol: Set of hashed IPs }

module.exports = function (app) {
  app.route('/api/stock-prices')
    .get(async function (req, res) {
      try {
        const stock = req.query.stock;
        const like = req.query.like === 'true';
        const clientIp = req.ip || req.headers['x-forwarded-for'];
        const hashedIp = crypto.createHash('sha256').update(clientIp).digest('hex');

        if (!stock) {
          return res.status(400).json({ error: 'Missing stock query parameter' });
        }

        const fetchStock = async (symbol) => {
          const response = await axios.get(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`);
          if (!response.data.symbol) {
            throw new Error(`Invalid stock symbol: ${symbol}`);
          }
          return {
            stock: response.data.symbol,
            price: response.data.latestPrice,
          };
        };

        const addLike = (symbol) => {
          if (!stocksLikes[symbol]) stocksLikes[symbol] = new Set();
          if (!stocksLikes[symbol].has(hashedIp)) {
            stocksLikes[symbol].add(hashedIp);
          }
        };

        if (Array.isArray(stock)) {
          const stockData = await Promise.all(stock.map(fetchStock));
          if (like) stock.forEach(addLike);

          const relLikes = stockData.map((data, index) => ({
            stock: data.stock,
            price: data.price,
            rel_likes:
              stocksLikes[stock[index]] ? stocksLikes[stock[index]].size : 0,
          }));

          return res.json({ stockData: relLikes });
        }

        const stockData = await fetchStock(stock);
        if (like) addLike(stock);

        res.json({
          stockData: {
            stock: stockData.stock,
            price: stockData.price,
            likes: stocksLikes[stock] ? stocksLikes[stock].size : 0,
          },
        });
      } catch (err) {
        console.error(err.message || err);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

  // Limpia los datos de likes para las pruebas
  if (process.env.NODE_ENV === 'test') {
    stocksLikes = {};
  }
};
