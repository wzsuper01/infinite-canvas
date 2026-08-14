import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { App, Button, Form, Input } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";

import { useUserStore } from "@/stores/use-user-store";

export default function AuthPage() {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [loading, setLoading] = useState(false);
    const { message } = App.useApp();
    const navigate = useNavigate();
    const login = useUserStore((s) => s.login);
    const register = useUserStore((s) => s.register);

    const onFinish = async (values: { username: string; password: string }) => {
        setLoading(true);
        try {
            if (mode === "login") {
                await login(values.username, values.password);
                message.success("登录成功");
            } else {
                await register(values.username, values.password);
                message.success("注册成功");
            }
            navigate("/");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "操作失败";
            // axios 错误中提取后端返回的错误信息
            const axiosErr = err as { response?: { data?: { error?: string } } };
            message.error(axiosErr.response?.data?.error || msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--ant-color-bg-layout)" }}>
            <div className="w-full max-w-sm rounded-2xl p-8" style={{ background: "var(--ant-color-bg-container)", boxShadow: "var(--ant-box-shadow)" }}>
                <div className="mb-8 text-center">
                    <img src="/logo.svg" alt="logo" className="mx-auto mb-4 size-12" />
                    <h1 className="text-xl font-semibold" style={{ color: "var(--ant-color-text)" }}>
                        无限画布
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: "var(--ant-color-text-secondary)" }}>
                        {mode === "login" ? "登录你的账号" : "创建新账号"}
                    </p>
                </div>

                <Form onFinish={onFinish} size="large" autoComplete="off">
                    <Form.Item name="username" rules={[{ required: true, message: "请输入用户名" }, { min: 2, max: 20, message: "用户名长度需在 2-20 个字符之间" }]}>
                        <Input prefix={<UserOutlined />} placeholder="用户名" />
                    </Form.Item>

                    <Form.Item name="password" rules={[{ required: true, message: "请输入密码" }, { min: 6, message: "密码长度不能少于 6 位" }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            {mode === "login" ? "登录" : "注册"}
                        </Button>
                    </Form.Item>
                </Form>

                <div className="text-center text-sm" style={{ color: "var(--ant-color-text-secondary)" }}>
                    {mode === "login" ? (
                        <>
                            还没有账号？
                            <button type="button" className="ml-1 text-primary underline" onClick={() => setMode("register")}>
                                注册
                            </button>
                        </>
                    ) : (
                        <>
                            已有账号？
                            <button type="button" className="ml-1 text-primary underline" onClick={() => setMode("login")}>
                                登录
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
