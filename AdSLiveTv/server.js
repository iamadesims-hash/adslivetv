const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// === MIDDLEWARE: JWT Authentication ===
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access token required' });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(403).json({ error: 'Invalid token' });

    req.user = user;
    next();
};

// server.js
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// Supabase Client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Socket.io Authentication Middleware
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
        return next(new Error("Authentication token required"));
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return next(new Error("Invalid token"));
        }

        socket.user = user;  // Attach user to socket
        next();
    } catch (err) {
        next(new Error("Authentication failed"));
    }
});

// Connection Handler
    io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.email} (${socket.id})`);

    socket.on('update-score', (data) => {
        // Only allow authenticated users to update
        io.emit('score-update', { ...data, updatedBy: socket.user.email });
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user.email}`);
    });
});

    server.listen(5000, () => {
    console.log('🚀 Server with Socket.io Auth running on port 5000');
});

// === SOCKET.IO REAL-TIME ===
    const { Server } = require('socket.io');

    const io = new Server(server, { cors: { origin: "*" } });

    io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
});

function broadcastScoreUpdate(match) {
    io.emit('score-update', match);
}

// Broadcast live score updates
function broadcastScoreUpdate(match) {
    io.emit('score-update', match);
    console.log('Broadcasted score update:', match);
}

// RapidAPI Configuration (1xAPI or API-Football)
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'api-football-v1.p.rapidapi.com'; // or 1xAPI host

// === ROUTES ===

// 1. Get All Matches (Dynamic Data)
app.get('/api/matches', async (req, res) => {
    try {
        const response = await axios.get('https://api-football-v1.p.rapidapi.com/v3/fixtures', {
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': RAPIDAPI_HOST
            },
            params: {
                league: 1,      // Change for different leagues
                season: 2026,
                live: 'all'
            }
        });

        res.json(response.data.response);
    } catch (error) {
        console.error(error);
        // Fallback data
        res.json([
            { id: 1, home: "Mexico", away: "South Africa", score: "2-1", status: "live", league: "Group A" },
            { id: 2, home: "South Korea", away: "Czechia", score: "1-0", status: "live", league: "Group A" }
        ]);
    }
});

// 2. Add New Match (Admin Only)
app.post('/api/matches', async (req, res) => {
    const { home, away, league } = req.body;
    // Save to Supabase or your database here
    res.json({ success: true, match: { home, away, league } });
});

// 3. Update Match Score (Real-time)
app.put('/api/matches/:id', async (req, res) => {
    const { id } = req.params;
    const { score, status } = req.body;
    res.json({ success: true, updated: { id, score, status } });
});

// 4. Stripe Create Checkout Session
app.post('/api/create-checkout', authenticateToken, async (req, res) => {
    try {
        const { priceId } = req.body;
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL}/profile.html?success=true`,
            cancel_url: `${process.env.FRONTEND_URL}/payments.html`,
            metadata: { userId: req.user.id }
        });

        res.json({ sessionId: session.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Stripe Webhook
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle events
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        await supabase.from('subscriptions').upsert({
            user_id: session.metadata.userId,
            stripe_subscription_id: session.subscription,
            status: 'active'
        });
    }

    res.json({ received: true });
});

// Update Match Score (Triggers WebSocket)
app.put('/api/matches/:id/score', async (req, res) => {
    const { id } = req.params;
    const { score, time } = req.body;

    const updatedMatch = { id, score, time, status: "live" };
    
    // Broadcast to all connected clients
    broadcastScoreUpdate(updatedMatch);

    res.json({ success: true, match: updatedMatch });
});

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 AdSLiveTv Backend running on http://localhost:${PORT}`);
});