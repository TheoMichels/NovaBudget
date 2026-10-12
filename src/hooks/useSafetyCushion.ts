import { useCallback, useEffect, useState } from "react";
import {
  getSafetyCushion,
  saveSafetyCushion,
} from "../storage/settingsRepository";

export function useSafetyCushion(defaultVal: number = 20000) {
  const [safetyCushionTarget, setSafetyCushionTarget] = useState<number>(defaultVal);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getSafetyCushion()
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

    return () => {
      isMounted = false;
    };
  }, []);

  const updateSafetyCushionTarget = useCallback(async (newTarget: number) => {
    setSafetyCushionTarget(newTarget);
    try {
      await saveSafetyCushion(newTarget);
    } catch (e) {
      console.error("Failed to persist safety cushion target", e);
    }
  }, []);

  return {
    safetyCushionTarget,
    updateSafetyCushionTarget,
    loading,
  };
}
