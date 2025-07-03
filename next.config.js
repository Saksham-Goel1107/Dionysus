/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
    eslint: {
        ignoreDuringBuilds: false,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    poweredByHeader: false,
    images: {
        domains: [
            "avatars.githubusercontent.com",
            "img.clerk.com",
            "avatars.githubusercontent.com"
        ],
    },
    webpack: (webpackConfig) => {
        webpackConfig.module.exprContextCritical = false;
        webpackConfig.cache = {
            type: 'filesystem',
            maxMemoryGenerations: 1,
        };
        return webpackConfig;
    },
};

export default config;
