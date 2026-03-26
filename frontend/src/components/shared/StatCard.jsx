import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { TrendingUp } from '@mui/icons-material';

export default function StatCard({ title, value, icon, color = '#6366f1', sub }) {
  return (
    <Card elevation={0} sx={{ borderRadius: 3, height: '100%',
      background: 'background.paper',
      transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="caption" sx={{
              color: 'text.secondary', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10
            }}>
              {title}
            </Typography>
            <Typography sx={{ fontSize: 32, fontWeight: 900, color: 'text.primary', lineHeight: 1.1, mt: 0.5 }}>
              {value}
            </Typography>
            {sub && <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>{sub}</Typography>}
          </Box>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2.5,
            bgcolor: `${color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${color}25`,
          }}>
            {React.cloneElement(icon, { sx: { color, fontSize: 22 } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
