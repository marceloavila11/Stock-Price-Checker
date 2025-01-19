'use strict';
const fetch = require('node-fetch'); // Asegúrate de usar node-fetch@2
const crypto = require('crypto'); // Para anonimizar IPs

let likesDb = {}; // Simulación de base de datos en memoria

module.exports = function (app) {
  app.route('/api/stock-prices')
    .get(async function (req, res) {
      try {
        const stock = req.query.stock;
        const like = req.query.like === 'true'; // Determina si el usuario quiere dar un like
        const ip = req.ip || req.connection.remoteAddress; // Obtén la IP del cliente
        const hashedIp = crypto.createHash('sha256').update(ip).digest('hex'); // Anonimiza la IP

        if (!stock) return res.status(400).json({ error: 'stock query parameter is required' });

        const stocks = Array.isArray(stock) ? stock : [stock]; // Permite manejar uno o dos stocks
        const results = await Promise.all(
          stocks.map(async (s) => {
            try {
              const stockData = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${s}/quote`)
                .then(response => {
                  if (!response.ok) throw new Error('Stock API error');
                  return response.json();
                });

              if (!stockData.symbol) throw new Error('Invalid stock symbol');

              likesDb[s] = likesDb[s] || { likes: new Set() }; // Inicializa el contador de likes
              if (like) likesDb[s].likes.add(hashedIp); // Agrega un like si es requerido

              return {
                stock: stockData.symbol,
                price: stockData.latestPrice,
                likes: likesDb[s].likes.size
              };
            } catch (error) {
              return { error: `Error fetching stock data for ${s}` };
            }
          })
        );

        if (results.some(result => result.error)) {
          return res.status(500).json(results);
        }

        if (results.length === 1) {
          res.json({ stockData: results[0] });
        } else {
          const rel_likes = results[0].likes - results[1].likes;
          res.json({
            stockData: results.map((result, idx) => ({
              stock: result.stock,
              price: result.price,
              rel_likes: idx === 0 ? rel_likes : -rel_likes
            }))
          });
        }
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
};
