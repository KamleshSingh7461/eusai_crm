import { notFound } from 'next/navigation';
import { isDevLoginEnabled } from '@/lib/env';
import DesignPreview from './DesignPreview';

export const dynamic = 'force-dynamic';

// Local-only preview of the proposed redesign. Not reachable on staging or production.
export default function DesignPreviewPage() {
    if (!isDevLoginEnabled) notFound();
    return <DesignPreview />;
}
