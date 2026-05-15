declare module 'bootstrap/dist/js/bootstrap.bundle.min.js';
declare module "bootstrap/js/dist/modal" {
  export default class Modal {
    constructor(element: Element);

    static getInstance(
      element: Element
    ): Modal | null;

    show(): void;
    hide(): void;
    toggle(): void;
  }
}