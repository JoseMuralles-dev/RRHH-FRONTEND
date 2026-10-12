const { createRequire } = require('node:module');
const path = require('node:path');
const backendRequire = createRequire(path.join(process.cwd(), 'package.json'));
backendRequire('ts-node/register/transpile-only');
const mysql = backendRequire('mysql2/promise');
const { VacacionesGestionService } = backendRequire('./src/modules/vacaciones/vacaciones-gestion.service.ts');
const { TablaSaldosDto } = backendRequire('./src/modules/vacaciones/dto/saldo-vacaciones.dto.ts');
(async () => {
  const c = await mysql.createConnection({host:process.env.DB_HOST, port:Number(process.env.DB_PORT || 3306), user:process.env.DB_USERNAME, password:process.env.DB_PASSWORD, database:process.env.DB_DATABASE});
  try {
    const manager = {query: async (sql, params) => (await c.query(sql, params))[0]};
    const db = {transaction: async (...args) => args.at(-1)(manager)};
    const service = new VacacionesGestionService(db, {actor: async () => ({idEmpleado:null,rol:{codigoRol:'RRHH',nivelJerarquico:3}})});
    const result = await service.tablaSaldos(0, Object.assign(new TablaSaldosDto(), {limite:1}));
    console.log(JSON.stringify({consulta:'vw_vacaciones_saldos',correcta:true,filasMuestra:result.items.length,campos:result.items[0] ? Object.keys(result.items[0]) : [],tipoSaldo:typeof result.items[0]?.saldoDias}));
  } finally {await c.end();}
})().catch(e => {console.error(e.code || e.name);process.exitCode=1;});
