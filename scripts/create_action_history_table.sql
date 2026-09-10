-- =====================================================
-- Table: app_action_history
-- Stocke l'historique des actions admin dans Supabase
-- =====================================================

CREATE TABLE IF NOT EXISTS app_action_history (
  singleton_id TEXT PRIMARY KEY DEFAULT 'main',
  history JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pas besoin d'index supplémentaire : singleton_id est la clé primaire

-- ── RLS (Row Level Security) ──
-- Avec l'anon key, on autorise tout (lecture/écriture)
-- car l'app gère les permissions côté client.
ALTER TABLE app_action_history ENABLE ROW LEVEL SECURITY;

-- Politique : permettre toutes les opérations pour les utilisateurs anon
CREATE POLICY "Allow all for anon" ON app_action_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── Nettoyage auto : garder seulement les 500 dernières actions ──
-- (optionnel, peut être appelé manuellement ou via un cron Supabase)
-- DELETE FROM app_action_history
-- WHERE id NOT IN (
--   SELECT id FROM app_action_history ORDER BY timestamp DESC LIMIT 500
-- );
