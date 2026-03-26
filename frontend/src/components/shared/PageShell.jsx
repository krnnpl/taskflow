import React from 'react';
import { Box, Typography, Button } from '@mui/material';

export default function PageShell({ title, subtitle, action, children }) {
  return (
    <Box>
      {(title || action) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          {title && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>{title}</Typography>
              {subtitle && <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>{subtitle}</Typography>}
            </Box>
          )}
          {action}
        </Box>
      )}
      {children}
    </Box>
  );
}
