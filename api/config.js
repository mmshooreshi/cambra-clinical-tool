// api/config.js
// Returns standalone CAMBRA configuration

import { DEFAULT_CAMBRA_CONFIG } from '../src/cambraConfig.js';

export default function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    return res.status(200).json(DEFAULT_CAMBRA_CONFIG);
}
