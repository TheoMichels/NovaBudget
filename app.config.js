module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    // Décision au build : une clé présente ne doit jamais activer le cloud localement.
    storageMode: process.env.VERCEL === '1' && process.env.VERCEL_ENV !== 'development' ? 'supabase' : 'local',
  },
});
