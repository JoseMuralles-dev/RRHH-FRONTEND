import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from '../../../../core/services/auth';
import { Ventas } from './ventas';
import { API } from '../../../../core/config/apis';
const base=API.baseUrl+'/kpi/ventas';
const pendiente={idEmpleado:21,nombre:'Ana Perez',estado:'INCOMPLETA',notaFinal:null,resultados:[{codigo:'VEN_NOTAS_CREDITO',pesoPorcentaje:5,valorObtenido:'0.450100',metaAplicada:'0.45',estado:'REGLA_PENDIENTE',puntos:null,mesesFaltantes:[]}]};
const respuesta={periodo:{anio:2026,mes:1,fechaInicio:'2026-01-01',fechaFin:'2026-01-31',provisional:false},criterios:['Cartera historica pendiente de validacion'],empleados:[pendiente]};
describe('KPI Ventas frontend',()=>{
  let http:HttpTestingController, fixture:ComponentFixture<Ventas>, c:Ventas;
  async function abrir(nivel=3) {
    TestBed.configureTestingModule({imports:[Ventas],providers:[provideHttpClient(),provideHttpClientTesting(),{provide:AuthService,useValue:{getUsuarioSesion:()=>({idUsuario:1,idEmpleado:21,nivelJerarquico:nivel})}}]});
    fixture=TestBed.createComponent(Ventas); c=fixture.componentInstance; http=TestBed.inject(HttpTestingController);
    http.expectOne(base+'/empleados').flush([{idEmpleado:21,nombre:'Ana Perez'}]);
  }
  afterEach(()=>http?.verify());
  it('muestra nota pendiente sin inventar cero y conserva precision NC',async()=>{
    await abrir(); http.expectOne(r=>r.url===base+'/equipo').flush(respuesta); await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Nota pendiente');
    expect(fixture.nativeElement.textContent).toContain('0.450100%');
    expect(fixture.nativeElement.textContent).toContain('Regla pendiente');
    const guardar=[...fixture.nativeElement.querySelectorAll('button')].find((b:any)=>b.textContent.includes('Guardar evaluacion')) as HTMLButtonElement;
    expect(guardar.disabled).toBe(true);
  });
  it('empleado consulta solo dashboard propio y no tiene formularios de escritura',async()=>{
    await abrir(1);http.expectOne(r=>r.url===base+'/mi-dashboard').flush(respuesta);await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('form').length).toBe(0);
    expect(fixture.nativeElement.textContent).not.toContain('Guardar evaluacion');
  });
  it('finaliza carga en error SAP sin clic adicional y permite gestionar datos',async()=>{
    await abrir();http.expectOne(r=>r.url===base+'/equipo').flush({}, {status:503,statusText:'Unavailable'});await fixture.whenStable();
    expect(c.cargando()).toBe(false);expect(fixture.nativeElement.textContent).toContain('SAP no esta disponible');
    c.elegir(21);http.expectOne(r=>r.url===base+'/metas').flush([]);http.expectOne(r=>r.url===base+'/nuevos-clientes').flush({cantidad:2});await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('form').length).toBe(2);expect(c.cantidad).toBe(2);
  });
  it('envia cantidad absoluta y no suma el registro existente',async()=>{
    await abrir(2);http.expectOne(r=>r.url===base+'/equipo').flush(respuesta);
    c.elegir(21);http.expectOne(r=>r.url===base+'/metas').flush([]);http.expectOne(r=>r.url===base+'/nuevos-clientes').flush({cantidad:2});
    c.cantidad=3;c.guardarClientes();const req=http.expectOne(r=>r.url===base+'/nuevos-clientes'&&r.method==='PUT');
    expect(req.request.body).toEqual({idEmpleado:21,fecha:c.hoy,cantidad:3});req.flush({});http.expectOne(r=>r.url===base+'/equipo').flush(respuesta);await fixture.whenStable();
    expect(fixture.nativeElement.textContent).not.toContain('Guardar meta');expect(c.guardando()).toBe(false);
  });
  it('envia la meta decimal como texto y recarga acumulados',async()=>{
    await abrir();http.expectOne(r=>r.url===base+'/equipo').flush(respuesta);c.elegir(21);
    http.expectOne(r=>r.url===base+'/metas').flush([]);http.expectOne(r=>r.url===base+'/nuevos-clientes').flush({cantidad:null});
    c.meta='50000.25';c.guardarMeta();const req=http.expectOne(r=>r.url===base+'/metas'&&r.method==='PUT');expect(req.request.body.metaObjetivo).toBe('50000.25');
    req.flush({});http.expectOne(r=>r.url===base+'/metas').flush([]);http.expectOne(r=>r.url===base+'/equipo').flush(respuesta);
  });
  it('bloquea meses futuros sin consultar SAP',async()=>{
    await abrir();http.expectOne(r=>r.url===base+'/equipo').flush(respuesta);c.periodo='2100-12';c.cargar();http.expectNone(r=>r.url===base+'/equipo');expect(c.error()).toContain('no futuro');
  });
  it('filtra un vendedor sin mostrar las otras fichas',async()=>{
    await abrir();http.expectOne(r=>r.url===base+'/equipo').flush({...respuesta,empleados:[pendiente,{...pendiente,idEmpleado:22,nombre:'Otro vendedor'}]});
    c.elegir(21);http.expectOne(r=>r.url===base+'/metas').flush([]);http.expectOne(r=>r.url===base+'/nuevos-clientes').flush({cantidad:0});await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('article').length).toBe(1);expect(c.visibles()[0].idEmpleado).toBe(21);
  });
});
