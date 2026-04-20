import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import createCheckoutSession from './api/create-checkout-session.js';
import webhookHandler from './api/webhook.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GAMMA_API = 'https://gamma-api.polymarket.com';
const CLOB_API = 'https://clob.polymarket.com';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  // Vercel-style handlers integration for development
  app.post('/api/create-checkout-session', express.json(), (req, res) => createCheckoutSession(req, res));
  app.post('/api/webhook', (req, res) => webhookHandler(req, res));

  app.use(express.json());

  // --- Polymarket API Proxy ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Get Enhanced Trending Markets (Gamma + CLOB)
  app.get('/api/polymarket/trending', async (req, res) => {
    try {
      // 1. Fetch trending markets from Gamma
      const gammaRes = await axios.get(`${GAMMA_API}/markets`, {
        params: {
          limit: 6,
          order: 'volume24hr',
          ascending: false,
          active: true
        }
      });
      
      const markets = gammaRes.data;
      
      // 2. Enhance with CLOB data (midpoints/spreads) and detailed metadata
      const enhancedMarkets = await Promise.all(markets.map(async (m: any) => {
        let clobData = { midpoint: null, spread: null };
        
        // Find the "Yes" token ID or the first active token
        const token = m.activeTokens?.find((t: any) => t.outcome === 'Yes') || m.activeTokens?.[0];
        
        if (token?.tokenId) {
          try {
            // Fetch midpoint and orderbook from CLOB for midpoint/spread
            const [midRes, bookRes] = await Promise.all([
              axios.get(`${CLOB_API}/midpoint`, { params: { token_id: token.tokenId } }).catch(() => null),
              axios.get(`${CLOB_API}/book`, { params: { token_id: token.tokenId } }).catch(() => null)
            ]);
            
            clobData.midpoint = midRes?.data?.midpoint || null;
            
            // Calculate spread if book is available
            if (bookRes?.data) {
              const asks = bookRes.data.asks || [];
              const bids = bookRes.data.bids || [];
              if (asks.length > 0 && bids.length > 0) {
                const bestAsk = parseFloat(asks[0].price);
                const bestBid = parseFloat(bids[0].price);
                clobData.spread = parseFloat((bestAsk - bestBid).toFixed(4));
              }
            }
          } catch (clobErr) {
            // Silently fail CLOB parts
          }
        }
        
        return {
          ...m,
          clob: clobData,
          tokenUsed: token,
          // Extract tags and series if they are in the nested structures
          tags: m.tags || [],
          series: m.series || null
        };
      }));

      res.json(enhancedMarkets);
    } catch (error: any) {
      console.error('Error fetching trending markets:', error.message);
      res.status(500).json({ error: 'Failed to fetch enhanced polymorphic markets' });
    }
  });

  // Get Market Details (Gamma)
  app.get('/api/polymarket/market/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const response = await axios.get(`${GAMMA_API}/markets/${id}`);
      res.json(response.data);
    } catch (error: any) {
      console.error(`Error fetching market ${req.params.id}:`, error.message);
      res.status(500).json({ error: 'Failed to fetch market details' });
    }
  });

  // Get Price History (CLOB) - Example endpoint
  app.get('/api/polymarket/history/:conditionId', async (req, res) => {
    try {
      const { conditionId } = req.params;
      // In CLOB API, fetching historical data usually requires the condition ID or specific token IDs
      // This is a simplified entry point
      const response = await axios.get(`${CLOB_API}/prices-history`, {
        params: {
          interval: '1h',
          market: conditionId
        }
      });
      res.json(response.data);
    } catch (error: any) {
      console.error('Error fetching price history:', error.message);
      res.status(500).json({ error: 'Failed to fetch price history' });
    }
  });

  // --- Vite / Static Assets ---

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
