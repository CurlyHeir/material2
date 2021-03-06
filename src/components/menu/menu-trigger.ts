import {
    Directive,
    ElementRef,
    Input,
    Output,
    EventEmitter,
    HostListener,
    ViewContainerRef,
    AfterViewInit,
    OnDestroy
} from '@angular/core';
import {MdMenu} from './menu';
import {MdMenuItem, MdMenuAnchor} from './menu-item';
import {MdMenuMissingError} from './menu-errors';
import {
    Overlay,
    OverlayState,
    OverlayRef,
    OVERLAY_PROVIDERS,
    TemplatePortal
} from '@angular2-material/core/core';
import {
    ConnectedPositionStrategy
} from '@angular2-material/core/overlay/position/connected-position-strategy';
import {
  HorizontalConnectionPos,
  VerticalConnectionPos
} from '@angular2-material/core/overlay/position/connected-position';

/**
 * This directive is intended to be used in conjunction with an md-menu tag.  It is
 * responsible for toggling the display of the provided menu instance.
 */
@Directive({
  selector: '[md-menu-trigger-for]',
  host: {'aria-haspopup': 'true'},
  providers: [OVERLAY_PROVIDERS],
  exportAs: 'mdMenuTrigger'
})
export class MdMenuTrigger implements AfterViewInit, OnDestroy {
  private _portal: TemplatePortal;
  private _overlayRef: OverlayRef;
  menuOpen: boolean = false;

  @Input('md-menu-trigger-for') menu: MdMenu;
  @Output() onMenuOpen = new EventEmitter();
  @Output() onMenuClose = new EventEmitter();

  constructor(private _overlay: Overlay, private _element: ElementRef,
              private _viewContainerRef: ViewContainerRef) {}

  ngAfterViewInit() {
    this._checkMenu();
    this.menu.close.subscribe(() => this.closeMenu());
  }

  ngOnDestroy() { this.destroyMenu(); }

  @HostListener('click')
  toggleMenu(): Promise<void> {
    return this.menuOpen ? this.closeMenu() : this.openMenu();
  }

  openMenu(): Promise<void> {
    return this._createOverlay()
      .then(() => this._overlayRef.attach(this._portal))
      .then(() => this._setIsMenuOpen(true));
  }

  closeMenu(): Promise<void> {
    if (!this._overlayRef) { return Promise.resolve(); }

    return this._overlayRef.detach()
        .then(() => this._setIsMenuOpen(false));
  }

  destroyMenu(): void {
    if (this._overlayRef) { this._overlayRef.dispose(); }
  }

  // set state rather than toggle to support triggers sharing a menu
  private _setIsMenuOpen(isOpen: boolean): void {
    this.menuOpen = isOpen;
    this.menu._setClickCatcher(isOpen);
    this.menuOpen ? this.onMenuOpen.emit(null) : this.onMenuClose.emit(null);
  }

  /**
   *  This method checks that a valid instance of MdMenu has been passed into
   *  md-menu-trigger-for.  If not, an exception is thrown.
   */
  private _checkMenu() {
    if (!this.menu || !(this.menu instanceof MdMenu)) {
      throw new MdMenuMissingError();
    }
  }

  /**
   *  This method creates the overlay from the provided menu's template and saves its
   *  OverlayRef so that it can be attached to the DOM when openMenu is called.
   */
  private _createOverlay(): Promise<any> {
    if (this._overlayRef) { return Promise.resolve(); }

    this._portal = new TemplatePortal(this.menu.templateRef, this._viewContainerRef);
    return this._overlay.create(this._getOverlayConfig())
        .then(overlay => this._overlayRef = overlay);
  }

  /**
   * This method builds the configuration object needed to create the overlay, the OverlayState.
   * @returns OverlayState
   */
  private _getOverlayConfig(): OverlayState {
    const overlayState = new OverlayState();
    overlayState.positionStrategy = this._getPosition();
    return overlayState;
  }

  /**
   * This method builds the position strategy for the overlay, so the menu is properly connected
   * to the trigger.
   * @returns ConnectedPositionStrategy
   */
  private _getPosition(): ConnectedPositionStrategy  {
    const positionX: HorizontalConnectionPos = this.menu.positionX === 'before' ? 'end' : 'start';
    const positionY: VerticalConnectionPos = this.menu.positionY === 'above' ? 'bottom' : 'top';

    return this._overlay.position().connectedTo(
      this._element,
      {originX: positionX, originY: positionY},
      {overlayX: positionX, overlayY: positionY}
    );
  }
}

export const MD_MENU_DIRECTIVES = [MdMenu, MdMenuItem, MdMenuTrigger, MdMenuAnchor];
