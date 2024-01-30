import { createLogger, format, transports } from 'winston';

const loggerDevelopment = createLogger({
  level: 'debug',
  format: format.combine(format.colorize(), format.simple()),
  transports: [new transports.Console()],
});

const loggerProduction = createLogger({
  level: 'info',
  format: format.json(),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'errors.log', level: 'error' }),
  ],
});

export const logToConsole = (level, message) => {
  loggerDevelopment.log(level, message);
};

export const logToFile = (level, message) => {
  loggerProduction.log(level, message);
};
