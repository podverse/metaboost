// Type declarations for SCSS module imports (e.g. import styles from './Component.module.scss').
declare module "*.module.scss" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.scss" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
