import { Request, Response } from 'express'
import knex from '../database/connection'

class PointsController {

    async index(request: Request, response: Response) {
        // cidade, uf, items (Query Params)
        const { city, uf, items } = request.query
        console.log({ city, uf, items })

        const parsedItems = String(items).split(',').map(item => Number(item.trim()))

        const points = await knex('points')
            .join('point_items', 'points.id', '=', 'point_items.point_id')
            .whereIn('point_items.item_id', parsedItems)
            .where('city', String(city))
            .where('uf', String(uf))
            .distinct()
            .select('points.*')

        const serializedPoints = points.map(point => {
            return {
                ...point,
                image_url: `http://192.168.0.112:3333/uploads/${point.image}`
            }
        })


        return response.json(serializedPoints)
    }

    async show(request: Request, response: Response) {
        const { id } = request.params

        const point = await knex('points').where('id', id).first();

        if (!point) {
            return response.status(404).json({ error: 'Point not Found' })
        }
        const items = await knex('items')
            .join('point_items', 'items.id', '=', 'point_items.item_id')
            .where('point_items.point_id', id)

        const serializedPoint = {
            ...point,
            image_url: `http://192.168.0.112:3333/uploads/${point.image}`
        }

        return response.json({ point: serializedPoint, items })
    }
    async create(request: Request, response: Response) {
        const {
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
            number,
            items
        } = request.body

        const trx = await knex.transaction()

        const point = {
            name,
            image: request.file.filename,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
            number
        }
        const [point_id] = await trx('points').insert(point)

        const pointItems = items
            .split(',')
            .map((item: string) => Number(item.trim()))
            .map((item_id: number) => {
                return { item_id, point_id }
            })

        await trx('point_items').insert(pointItems)

        await trx.commit()

        return response.json({ ...point, id: point_id })
    }
}

export default PointsController