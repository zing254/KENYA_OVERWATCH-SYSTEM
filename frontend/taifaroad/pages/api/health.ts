import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ status: string; timestamp: string }>
) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
}
