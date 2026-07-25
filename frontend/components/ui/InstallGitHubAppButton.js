import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { GitBranch, ExternalLink } from "lucide-react";

export default function InstallGitHubAppButton() {
  const appSlug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG;
  const installUrl = `https://github.com/apps/${appSlug}/installations/new`;

  return (
    <Button asChild variant="outline" className="gap-2 border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-white">
      <Link href={installUrl} target="_blank" rel="noopener noreferrer">
        <GitBranch className="h-4 w-4" />
        <span>Install GitHub App</span>
        <ExternalLink className="h-3 w-3 opacity-60" />
      </Link>
    </Button>
  );
}