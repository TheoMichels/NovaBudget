import { getCloudReadError } from "../services/syncService";
import { isLocalMode } from "../config/storageMode";
import { useCallback, useEffect, useState } from "react";
import { getCurrentUser, onAuthStateChange } from "../services/authService";
import {
  DEFAULT_SAFETY_CUSHION,
  getSafetyCushion,
  saveSafetyCushion,
} from "../storage/settingsRepository";

export function useSafetyCushion(
  defaultVal: number = DEFAULT_SAFETY_CUSHION
) {
  const [safetyCushionTarget, setSafetyCushionTarget] =
    useState<number>(defaultVal);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadIndex, setReloadIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const load = (userId?: string) => {
      setLoading(true);
      setError(null);
      getSafetyCushion(userId)
        .then((val) => {
          if (isMounted) {
            setSafetyCushionTarget(val);
            setError(getCloudReadError("user_settings"));
          }
        })
        .catch((e: unknown) => {
          if (isMounted) setError(e instanceof Error ? e.message : "Chargement du seuil impossible.");
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false);
          }
        });
    };

    if (isLocalMode) {
      load();
      return () => { isMounted = false; };
    }

    // Chargement initial
    getCurrentUser()
      .then((user) => {
        if (!isMounted) return;
        if (user) {
          load(user.id);
        } else {
          setSafetyCushionTarget(defaultVal);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSafetyCushionTarget(defaultVal);
          setLoading(false);
        }
      });

    // Écoute des changements d'authentification
    const subscription = onAuthStateChange((_session, user) => {
      if (!isMounted) return;
      if (user) {
        load(user.id);
      } else {
        setSafetyCushionTarget(defaultVal);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [defaultVal, reloadIndex]);

  const updateSafetyCushionTarget = useCallback(
    async (newTarget: number) => {
      try {
        await saveSafetyCushion(newTarget);
        setSafetyCushionTarget(newTarget);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Enregistrement du seuil impossible.");
      }
    },
    []
  );

  return {
    safetyCushionTarget,
    updateSafetyCushionTarget,
    loading,
    error,
    reload: () => setReloadIndex(value => value + 1),
  };
}
