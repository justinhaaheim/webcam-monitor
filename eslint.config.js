import jhaConfig from 'eslint-config-jha-react-node';

export default [
  ...jhaConfig,

  {
    files: ['**/*.ts', '**/*.tsx'],

    languageOptions: {
      parserOptions: {
        // Add ecmaFeatures from eslint-config-react-app
        // ecmaFeatures: {
        //   jsx: true,
        // },

        // ecmaVersion: 2020,

        // Re: project: true: https://typescript-eslint.io/blog/parser-options-project-true/
        project: ['./tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json'],

        // See: https://typescript-eslint.io/blog/announcing-typescript-eslint-v8-beta/#project-service
        projectService: true,

        // sourceType: 'module',

        // // @ts-expect-error No idea why it's saying TS2339: Property 'dirname' does not exist on type 'ImportMeta'.
        tsconfigRootDir: import.meta.dirname,

        // warnOnUnsupportedTypeScriptVersion: true, // From eslint-config-react-app
      },
    },
  },
];
