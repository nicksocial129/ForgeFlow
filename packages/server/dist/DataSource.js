"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDataSource = exports.init = void 0;
require("reflect-metadata");
const path_1 = __importDefault(require("path"));
const typeorm_1 = require("typeorm");
const utils_1 = require("./utils");
const entities_1 = require("./database/entities");
const sqlite_1 = require("./database/migrations/sqlite");
const mysql_1 = require("./database/migrations/mysql");
const postgres_1 = require("./database/migrations/postgres");
let appDataSource;
const init = async () => {
    var _a, _b;
    let homePath;
    switch (process.env.DATABASE_TYPE) {
        case 'sqlite':
            homePath = (_a = process.env.DATABASE_PATH) !== null && _a !== void 0 ? _a : path_1.default.join((0, utils_1.getUserHome)(), '.flowise');
            appDataSource = new typeorm_1.DataSource({
                type: 'sqlite',
                database: path_1.default.resolve(homePath, 'database.sqlite'),
                synchronize: false,
                migrationsRun: false,
                entities: Object.values(entities_1.entities),
                migrations: sqlite_1.sqliteMigrations
            });
            break;
        case 'mysql':
            appDataSource = new typeorm_1.DataSource({
                type: 'mysql',
                host: process.env.DATABASE_HOST,
                port: parseInt(process.env.DATABASE_PORT || '3306'),
                username: process.env.DATABASE_USER,
                password: process.env.DATABASE_PASSWORD,
                database: process.env.DATABASE_NAME,
                charset: 'utf8mb4',
                synchronize: false,
                migrationsRun: false,
                entities: Object.values(entities_1.entities),
                migrations: mysql_1.mysqlMigrations
            });
            break;
        case 'postgres':
            appDataSource = new typeorm_1.DataSource({
                type: 'postgres',
                host: process.env.DATABASE_HOST,
                port: parseInt(process.env.DATABASE_PORT || '5432'),
                username: process.env.DATABASE_USER,
                password: process.env.DATABASE_PASSWORD,
                database: process.env.DATABASE_NAME,
                synchronize: false,
                migrationsRun: false,
                entities: Object.values(entities_1.entities),
                migrations: postgres_1.postgresMigrations
            });
            break;
        default:
            homePath = (_b = process.env.DATABASE_PATH) !== null && _b !== void 0 ? _b : path_1.default.join((0, utils_1.getUserHome)(), '.flowise');
            appDataSource = new typeorm_1.DataSource({
                type: 'sqlite',
                database: path_1.default.resolve(homePath, 'database.sqlite'),
                synchronize: false,
                migrationsRun: false,
                entities: Object.values(entities_1.entities),
                migrations: sqlite_1.sqliteMigrations
            });
            break;
    }
};
exports.init = init;
function getDataSource() {
    if (appDataSource === undefined) {
        (0, exports.init)();
    }
    return appDataSource;
}
exports.getDataSource = getDataSource;
//# sourceMappingURL=DataSource.js.map