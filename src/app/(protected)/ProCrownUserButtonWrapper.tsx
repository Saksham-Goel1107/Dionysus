'use client';

import { useEffect, useState } from 'react';
import ProCrownUserButton from '@/app/(protected)/_components/ProCrownUserButton';

export default function ProCrownUserButtonWrapper() {
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const fetchProStatus = async () => {
      const response = await fetch('/api/user/pro-status');
      const data = await response.json();
      setIsPro(data.isPro);
    };

    fetchProStatus();
  }, []);

  return <ProCrownUserButton isPro={isPro} />;
}
