import { TestBed } from '@angular/core/testing';
import { DocumentoCard } from './documento-card';
import { documento } from '../../testing/fixtures';
describe('DocumentoCard', () => {
  it('muestra metadata sin revelar ruta interna y emite la descarga', () => {
    const f = TestBed.createComponent(DocumentoCard); f.componentRef.setInput('documento', documento); f.componentRef.setInput('disponibleDescarga', true);
    const descargar = vi.fn(); f.componentInstance.descargar.subscribe(descargar); f.detectChanges();
    expect(f.nativeElement.textContent).toContain('dpi.pdf'); expect(f.nativeElement.textContent).not.toContain('privado/no-exponer');
    Array.from<HTMLButtonElement>(f.nativeElement.querySelectorAll('button')).find((b: any) => b.textContent.includes('Descargar'))!.dispatchEvent(new Event('click')); expect(descargar).toHaveBeenCalledWith(documento);
    expect(f.nativeElement.textContent).not.toContain('Desactivar');
  });
});
