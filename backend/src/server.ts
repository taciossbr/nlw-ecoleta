import path from "path";
import express, { response } from 'express'
import routes from "./routes";
import {errors} from 'celebrate'

import cors from 'cors'

const app = express();

app.use(express.json())

app.use(cors())

console.log(path.relative(__dirname, 'uploads'))
app.use(routes)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use(errors())
app.listen(3333)

// TODO: ts-node