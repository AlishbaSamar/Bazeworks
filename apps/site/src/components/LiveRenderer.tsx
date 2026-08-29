"use client";

import { useMemo } from "react";
import { Render } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { puckConfig } from "@/lib/puck-config";
import { EditorRouteProvider, type PreviewEntryRef } from "@/lib/editor-route-context";
import {
  GlobalComponentsProvider,
  withGlobalFooterDefaults,
  withGlobalHeaderDefaults,
} from "@/lib/global-components-panel";
import { googleFontsHref, themeCssVarsToStyleText, withThemeDefaults } from "@/lib/theme";
import type { CollectionField } from "@/lib/collections";
import type { NavbarProps, FooterProps } from "@/lib/puck-components/sections";
import type { RenderResponse } from "@site/lib/render-client";

const noop = () => {};

export function LiveRenderer({ data }: { data: RenderResponse }) {
  const theme = useMemo(() => withThemeDefaults(data.website.theme), [data.website.theme]);
  const header = useMemo(
    () => withGlobalHeaderDefaults(data.website.globalHeader as Partial<NavbarProps>),
    [data.website.globalHeader],
  );
  const footer = useMemo(
    () => withGlobalFooterDefaults(data.website.globalFooter as Partial<FooterProps>),
    [data.website.globalFooter],
  );

  const previewEntry: PreviewEntryRef | null = data.entry
    ? {
        collectionId: data.entry.collectionId,
        entryId: data.entry.id,
        data: data.entry.data,
        fields: data.collectionFields as unknown as CollectionField[],
      }
    : null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCssVarsToStyleText(theme) }} />
      <link
        rel="stylesheet"
        href={googleFontsHref([theme.typography.headingFont, theme.typography.bodyFont])}
      />
      <EditorRouteProvider workspaceId="" websiteId="" previewEntry={previewEntry} publicShare>
        <GlobalComponentsProvider
          header={header}
          footer={footer}
          onHeaderChange={noop}
          onFooterChange={noop}
        >
          <Render config={puckConfig} data={data.page.content} />
        </GlobalComponentsProvider>
      </EditorRouteProvider>
    </>
  );
}
