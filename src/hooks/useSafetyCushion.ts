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

  useEffect(() => {
    let isMounted = true;

    const load = (userId?: string) => {
      getSafetyCushion(userId)
        .then((val) => {
          if (isMounted) {
            setSafetyCushionTarget(val);
          }
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false);
          }
        });
    };

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
  }, [defaultVal]);

  const updateSafetyCushionTarget = useCallback(
    async (newTarget: number) => {
      setSafetyCushionTarget(newTarget);
      try {
        await saveSafetyCushion(newTarget);
      } catch (e) {
        console.error("Failed to persist safety cushion target", e);
      }
    },
    []
  );

  return {
    safetyCushionTarget,
    updateSafetyCushionTarget,
    loading,
  };
}
