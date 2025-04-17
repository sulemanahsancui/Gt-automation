// import { createLogger, format, transports } from 'winston'
// import 'winston-daily-rotate-file'

// export const logger = createLogger({
//   format: format.json(),
//   transports: [
//     new transports.DailyRotateFile({
//       name: 'file',
//       datePattern: 'YYYY-MM-DD',
//       filename: './logs/access-%DATE%.log',
//     } as any),
//     new transports.Console(),
//   ],
//   exceptionHandlers: [
//     new transports.DailyRotateFile({
//       name: 'file',
//       datePattern: 'YYYY-MM-DD',
//       filename: './logs/errors-%DATE%.log',
//     } as any),
//     new transports.Console(),
//   ],
//   exitOnError: false,
// })
