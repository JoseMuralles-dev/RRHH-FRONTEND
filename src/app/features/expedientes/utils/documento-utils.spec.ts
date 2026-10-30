import { fechaCalendario, guardarBlob, hoyGuatemala, tamanoArchivo, validarArchivo, vencimiento } from './documento-utils';
describe('Utilidades de documentos', () => {
  it('usa Guatemala al cruzar medianoche UTC', () => { expect(hoyGuatemala(new Date('2026-10-06T02:00:00Z'))).toBe('2026-10-05'); });
  it.each([['2026-10-04', 'VENCIDO'], ['2026-10-05', 'PROXIMO'], ['2026-11-04', 'PROXIMO'], ['2026-11-05', 'VIGENTE'], [null, 'SIN_FECHA'], ['2026-02-30', 'FECHA_INVALIDA']])('clasifica %s sin mutar el estado', (fecha, estado) => { expect(vencimiento({ fechaVencimiento: fecha }, '2026-10-05')).toBe(estado); });
  it('rechaza archivos inválidos, vacíos y mayores a 100 MB', () => {
    expect(validarArchivo(new File(['x'], 'a.pdf', { type: 'application/pdf' }))).toBe('');
    expect(validarArchivo(new File(['x'], 'a.exe', { type: 'application/pdf' }))).not.toBe('');
    expect(validarArchivo(new File([], 'a.pdf', { type: 'application/pdf' }))).toContain('vacío');
    expect(validarArchivo(new File([new Uint8Array(100 * 1024 * 1024 + 1)], 'a.png', { type: 'image/png' }))).toContain('100 MB');
    expect(fechaCalendario('2026-10-05T12:00:00Z')).toBeNull();
    expect(tamanoArchivo(null)).toBe('Tamaño no disponible'); expect(tamanoArchivo('1024')).toBe('1.0 KB');
  });
  it('libera el Blob temporal después de iniciar la descarga', () => {
    vi.useFakeTimers(); const crear = vi.fn(() => 'blob:prueba'), revocar = vi.fn();
    const originalCrear = URL.createObjectURL, originalRevocar = URL.revokeObjectURL;
    URL.createObjectURL = crear; URL.revokeObjectURL = revocar;
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    try { guardarBlob(new Blob(['pdf']), 'dpi.pdf'); expect(click).toHaveBeenCalled(); expect(revocar).not.toHaveBeenCalled(); vi.runAllTimers(); expect(revocar).toHaveBeenCalledWith('blob:prueba'); }
    finally { click.mockRestore(); URL.createObjectURL = originalCrear; URL.revokeObjectURL = originalRevocar; vi.useRealTimers(); }
  });
});
