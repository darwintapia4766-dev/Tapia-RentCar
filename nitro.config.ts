export default {
  rollupConfig: {
    onwarn(warning: { code: string }, warn: (w: unknown) => void) {
      if (warning.code === "MODULE_LEVEL_DIRECTIVE") return;
      warn(warning);
    },
  },
};
