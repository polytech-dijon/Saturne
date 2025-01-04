import express, { Request, Response } from 'express';

const app = express();

// Basic route
app.get('/api', (req: Request, res: Response): void => {
  res.status(200).json({ status: 200 });
});

export default app;
