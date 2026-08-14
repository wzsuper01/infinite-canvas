import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { App, Spin } from "antd";

import { createModelChannel, useConfigStore } from "@/stores/use-config-store";
import { useUserStore } from "@/stores/use-user-store";
import { useCanvasStore } from "@/stores/canvas/use-canvas-store";
import { usePromptSourceScheduler } from "@/hooks/use-prompt-source-scheduler";

export function ClientRootInit({ children }: { children: ReactNode }) {
    const { message } = App.useApp();
    const handledConfigParams = useRef(false);
    const cloudLoaded = useRef(false);
    const updateConfig = useConfigStore((state) => state.updateConfig);
    const config = useConfigStore((state) => state.config);
    const openConfigDialog = useConfigStore((state) => state.openConfigDialog);
    const initAuth = useUserStore((s) => s.initAuth);
    const isAuthLoading = useUserStore((s) => s.isAuthLoading);
    const isAuthenticated = useUserStore((s) => s.isAuthenticated);
    const loadFromCloud = useCanvasStore((s) => s.loadFromCloud);

    usePromptSourceScheduler();

    useEffect(() => {
        void initAuth();
    }, [initAuth]);

    // 认证成功后从云端拉取画布数据
    useEffect(() => {
        if (isAuthenticated && !cloudLoaded.current) {
            cloudLoaded.current = true;
            void loadFromCloud();
        }
    }, [isAuthenticated, loadFromCloud]);

    useEffect(() => {
        if (handledConfigParams.current) return;
        const searchParams = new URLSearchParams(window.location.search);
        const baseUrl = searchParams.get("baseUrl") || searchParams.get("baseurl");
        const apiKey = searchParams.get("apiKey") || searchParams.get("apikey");
        if (!baseUrl && !apiKey) return;
        handledConfigParams.current = true;
        searchParams.delete("baseUrl");
        searchParams.delete("baseurl");
        searchParams.delete("apiKey");
        searchParams.delete("apikey");
        window.history.replaceState(null, "", `${window.location.pathname}${searchParams.size ? `?${searchParams}` : ""}${window.location.hash}`);
        const firstChannel = config.channels[0];
        updateConfig(
            "channels",
            firstChannel
                ? config.channels.map((channel, index) =>
                      index === 0
                          ? {
                                ...channel,
                                ...(baseUrl ? { baseUrl } : {}),
                                ...(apiKey ? { apiKey } : {}),
                            }
                          : channel,
                  )
                : [createModelChannel({ id: "default", name: "默认渠道", baseUrl: baseUrl || undefined, apiKey: apiKey || "" })],
        );
        if (baseUrl) updateConfig("baseUrl", baseUrl);
        if (apiKey) updateConfig("apiKey", apiKey);
        openConfigDialog(false);
        message.success("已导入本地直连配置");
    }, [config.channels, message, openConfigDialog, updateConfig]);

    if (isAuthLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Spin size="large" />
            </div>
        );
    }

    return <>{children}</>;
}
