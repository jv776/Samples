declare namespace THREE {
    class CSS3DObject extends Object3D {
        constructor(element: HTMLElement | HTMLElement[] );

        elements: HTMLElement[];
    }

    class CSS3DSprite extends CSS3DObject {
        constructor(element: HTMLElement | HTMLElement[]);

    }

    class CSS3DArgonRenderer {
        constructor();

        domElement: HTMLElement;
        domElements: HTMLElement[];

        setClearColor(color: any, clearcolor: any): void;
        setViewport(x: number, y: number, width: number, height: number, side: number): void;
        showViewport(side: number): void;
        hideViewport(side: number): void;
        setSize(width: number, height: number): void;
        render(scene: THREE.Scene, camera: THREE.Camera, side: number): void;
    }

     class CSS3DArgonHUD {
        constructor();

        domElement: HTMLElement;
        hudElements: HTMLElement[];

        appendChild(element: HTMLElement, element2: HTMLElement): void;
        setViewport(x: number, y: number, width: number, height: number, side: number): void;
        showViewport(side: number): void;
        hideViewport(side: number): void;
        setSize(width: number, height: number): void;
        render(side: number): void;
    }

    class SunMoonLights {
        constructor();

        entities: any;
        sun: Light;
        moon: Light;
        lights: Object3D;

        update(date: any, frame: any): void;
    }
}