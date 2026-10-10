import { getDictionary } from "@/i18n/get-dictionary";
import { LogoMark } from "./Logo";

export async function Footer() {
  const { footer } = await getDictionary();
  return (
    <footer className="mt-24 border-t border-border-subtle">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-text-tertiary sm:flex-row">
        <div className="flex items-center gap-2">
          <LogoMark className="size-6" />
          <span>{footer.tagline}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>
            {footer.builtBy}{" "}
            <a href="https://amrelshabrawydev.github.io" className="text-text-secondary hover:text-primary">
              Amr Elshabrawy
            </a>
          </span>
          <a href="https://github.com/AmrElshabrawyDev/dev-fighter" className="text-text-secondary hover:text-primary">
            {footer.openSource}
          </a>
        </div>
      </div>
    </footer>
  );
}
