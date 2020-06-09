import React, { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import { FiArrowLeft } from "react-icons/fi";
import { Link, useHistory } from "react-router-dom";
import {
  Map, TileLayer, Marker
} from 'react-leaflet'


import './styles.css'

import logo from '../../assets/logo.svg'
import api from '../../services/api';
import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet';
import Dropzone from '../../components/Dropzone';

// arrau ou objeto manulamnet inforar tipo

interface Item {
  id: number,
  title: string,
  image_url: string
}

interface IBGEUFResponse {
  sigla: string
}
interface IBGECityResponse {
  nome: string
}


const CreatePoint = () => {
  const history = useHistory()
  const [items, setItems] = useState<Item[]>([])

  const [selectedFile, setSelectedFile] = useState<File>()
  const [ufs, setUfs] = useState<string[]>([])
  const [selectedUF, setSelectedUF] = useState("0")
  const [cities, setCities] = useState<string[]>([])
  const [selectedCity, setselectedCity] = useState("0")
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0])
  const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0])
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    number: ''
  })

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords
      console.log(pos.coords)
      setInitialPosition([latitude, longitude])
    })
  }, [])
  useEffect(() => {
    api.get('items').then(resp => {
      setItems(resp.data)
    })
  }, [])
  useEffect(() => {
    axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(resp => {
      const ufInitials = resp.data.map(uf => uf.sigla)
      setUfs(ufInitials)
    })
  }, [])

  useEffect(() => {
    if (selectedUF === '0') {
      return;
    }
    axios.get<IBGECityResponse[]>(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF}/municipios`)
      .then(resp => {
        const cityNames = resp.data.map(city => city.nome)
        setCities(cityNames)
      })


  }, [selectedUF])


  function handleSelectedUF(e: ChangeEvent<HTMLSelectElement>) {
    const uf = e.target.value
    setSelectedUF(uf)
  }
  function handleSelectedCity(e: ChangeEvent<HTMLSelectElement>) {
    const city = e.target.value
    setselectedCity(city)
  }

  function handleMapClick(e: LeafletMouseEvent) {
    const { lat, lng } = e.latlng
    setSelectedPosition([lat, lng])
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  function handleSelectedItem(id: number) {
    const alreadySelected = selectedItems.findIndex(item => item === id)
    if (alreadySelected >= 0) {
      const filtered = selectedItems.filter(item => item !== id)
      setSelectedItems(filtered)
    } else {
      setSelectedItems([...selectedItems, id])
    }
  }

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault()
    const { name, email, whatsapp, number } = formData
    const uf = selectedUF
    const city = selectedCity
    const [latitude, longitude] = selectedPosition
    const items = selectedItems
    const data = new FormData()
    data.append('name', name)
    data.append('email', email)
    data.append('whatsapp', whatsapp)
    data.append('uf', uf)
    data.append('city', city)
    data.append('items', items.join(','))
    data.append('latitude', String(latitude))
    data.append('longitude', String(longitude))
    data.append('number', number)
    if (selectedFile) {
      data.append('image', selectedFile)
    }

    await api.post('points', data)

    alert('Ponto de coleta criado')

    history.push('/')
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta" />

        <Link to="/"><FiArrowLeft /> Voltar para home</Link>
      </header>

      <form onSubmit={handleSubmit}>
        <h1>Cadastro do <br /> ponto de coleta</h1>
        <Dropzone onFileUploaded={setSelectedFile} />
        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>

          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input type="text"
              name="name" id="name" onChange={handleInputChange} />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input type="email" onChange={handleInputChange}
                name="email" id="email" />
            </div>
            <div className="field">
              <label htmlFor="whatsapp">Whatsapp</label>
              <input type="text" onChange={handleInputChange}
                name="whatsapp" id="whatsapp" />
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>
          <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={selectedPosition} />
          </Map>
          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>
              <select name="uf" id="uf" onChange={handleSelectedUF} value={selectedUF}>
                <option value="0">Selecione uma UF</option>
                {ufs.map(uf => (
                  <option value={uf} key={uf}>{uf}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select name="city" id="city" onChange={handleSelectedCity} value={selectedCity}>
                <option value="0">Selecione uma Cidade</option>
                {cities.map(city => (
                  <option value={city} key={city}>{city}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="number">Number</label>
              <input type="text" onChange={handleInputChange}
                name="number" id="number" />
            </div>
          </div>
        </fieldset>
        <fieldset>
          <legend>
            <h2>Itens de coleta</h2>
            <span>Selecione um ou mais ítens abaixo</span>
          </legend>
          <ul className="items-grid">
            {items.map(item =>
              <li key={item.id} onClick={() => handleSelectedItem(item.id)}
                className={selectedItems.includes(item.id) ? 'selected' : ''}>
                <img src={item.image_url} alt={item.title} />
                <span>{item.title}</span>
              </li>)}
          </ul>
        </fieldset>
        <button type="submit">Cadastrar ponto de coleta</button>
      </form>
    </div>
  )
}

export default CreatePoint