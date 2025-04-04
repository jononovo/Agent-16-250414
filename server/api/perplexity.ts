import { Request, Response } from 'express';

export const perplexitySearch = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const apiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Perplexity API key is not configured' });
    }
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "pplx-7b-online",
        messages: [
          {
            role: "user",
            content: query
          }
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Perplexity API error: ${response.status}`,
        details: errorText
      });
    }
    
    const result = await response.json();
    console.log('Perplexity API response:', JSON.stringify(result, null, 2));
    
    res.json(result);
  } catch (error: any) {
    console.error('Error in perplexity search:', error);
    res.status(500).json({ 
      error: 'Error connecting to Perplexity API', 
      message: error.message || 'Unknown error'
    });
  }
};