import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const CharacterSheet = ({ characterId, onCharacterSaved }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [attributes, setAttributes] = useState({
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10
  });
  
  const [skills, setSkills] = useState({
    acrobatics: false,
    animalHandling: false,
    arcana: false,
    athletics: false,
    deception: false,
    history: false,
    insight: false,
    intimidation: false,
    investigation: false,
    medicine: false,
    nature: false,
    perception: false,
    performance: false,
    persuasion: false,
    religion: false,
    sleightOfHand: false,
    stealth: false,
    survival: false
  });
  
  const [characterInfo, setCharacterInfo] = useState({
    name: '',
    class: '',
    level: 1,
    race: '',
    background: '',
    alignment: '',
    hp: 10,
    maxHp: 10,
    ac: 10,
    speed: 30,
    initiative: 0
  });
  
  const [equipment, setEquipment] = useState({
    weapons: [{ name: '', damage: '', attackBonus: 0 }],
    armor: { name: '', ac: 10 },
    magicItems: '',
    traits: ''
  });
  
  const [spells, setSpells] = useState({
    slots: { total: 0, used: 0 },
    spellList: [{ name: '', level: 0, description: '' }]
  });
  
  // Estado para control de carga y guardado
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Cargar datos del personaje
  useEffect(() => {
    if (characterId) {
      fetchCharacter();
    } else {
      setLoading(false);
    }
  }, [characterId]);
  
  // Función para cargar el personaje desde Supabase
  const fetchCharacter = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data && data.character_data) {
        // Establecer todos los estados desde character_data
        const charData = data.character_data;
        
        // Cargar datos en los estados correspondientes
        if (charData.attributes) setAttributes(charData.attributes);
        if (charData.skills) setSkills(charData.skills);
        if (charData.characterInfo) setCharacterInfo(charData.characterInfo);
        if (charData.equipment) setEquipment(charData.equipment);
        if (charData.spells) setSpells(charData.spells);
      }
    } catch (error) {
      console.error('Error fetching character:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Función para guardar el personaje en Supabase
  const saveCharacter = async () => {
    try {
      setSaving(true);
      
      // Recopilar todos los datos del personaje
      const characterData = {
        attributes,
        skills,
        characterInfo,
        equipment,
        spells
      };
      
      if (characterId) {
        // Actualizar personaje existente
        const { error } = await supabase
          .from('characters')
          .update({ 
            character_data: characterData,
            name: characterInfo.name || 'Personaje sin nombre',
            updated_at: new Date()
          })
          .eq('id', characterId);
          
        if (error) throw error;
      } else {
        // Crear nuevo personaje
        const { data, error } = await supabase
          .from('characters')
          .insert([{ 
            character_data: characterData,
            name: characterInfo.name || 'Personaje sin nombre'
          }])
          .select();
          
        if (error) throw error;
        
        // Llamar al callback con el nuevo ID
        if (data && data[0] && onCharacterSaved) {
          onCharacterSaved(data[0].id);
        }
      }
      
      alert('Personaje guardado con éxito');
    } catch (error) {
      console.error('Error saving character:', error);
      alert('Error al guardar el personaje');
    } finally {
      setSaving(false);
    }
  };
  
  // Calculate modifier based on attribute value
  const getModifier = (value) => {
    return Math.floor((value - 10) / 2);
  };
  
  // Get skill modifier including proficiency if applicable
  const getSkillModifier = (attribute, isProficient) => {
    const attributeValue = attributes[attribute];
    const attributeMod = getModifier(attributeValue);
    const profBonus = 2; // Assuming level 1-4 character
    
    return isProficient ? attributeMod + profBonus : attributeMod;
  };
  
  // Map skills to their primary attributes
  const skillAttributes = {
    acrobatics: 'dexterity',
    animalHandling: 'wisdom',
    arcana: 'intelligence',
    athletics: 'strength',
    deception: 'charisma',
    history: 'intelligence',
    insight: 'wisdom',
    intimidation: 'charisma',
    investigation: 'intelligence',
    medicine: 'wisdom',
    nature: 'intelligence',
    perception: 'wisdom',
    performance: 'charisma',
    persuasion: 'charisma',
    religion: 'intelligence',
    sleightOfHand: 'dexterity',
    stealth: 'dexterity',
    survival: 'wisdom'
  };
  
  // Format modifier with + or - sign
  const formatModifier = (mod) => {
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };
  
  // Handle attribute change
  const handleAttributeChange = (attr, value) => {
    setAttributes({
      ...attributes,
      [attr]: parseInt(value) || 0
    });
  };
  
  // Handle skill proficiency toggle
  const handleSkillToggle = (skill) => {
    setSkills({
      ...skills,
      [skill]: !skills[skill]
    });
  };
  
  // Tabs content
  const tabs = [
    {
      title: "Información Básica",
      content: (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
            <h2 className="text-xl font-bold mb-5 text-blue-800 border-b border-blue-200 pb-2">Información del Personaje</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Personaje</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  value={characterInfo.name}
                  placeholder="Nombre de tu personaje"
                  onChange={(e) => setCharacterInfo({...characterInfo, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Clase y Nivel</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  value={`${characterInfo.class} ${characterInfo.level}`}
                  placeholder="Ej: Guerrero 5"
                  onChange={(e) => {
                    const parts = e.target.value.split(' ');
                    const level = parseInt(parts[parts.length-1]) || 1;
                    const className = parts.slice(0, -1).join(' ');
                    setCharacterInfo({...characterInfo, class: className, level: level});
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Raza</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  value={characterInfo.race}
                  placeholder="Ej: Humano, Elfo, Enano..."
                  onChange={(e) => setCharacterInfo({...characterInfo, race: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Antecedente</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  value={characterInfo.background}
                  placeholder="Ej: Soldado, Noble, Sabio..."
                  onChange={(e) => setCharacterInfo({...characterInfo, background: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alineamiento</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  value={characterInfo.alignment}
                  placeholder="Ej: Legal Bueno, Caótico Neutral..."
                  onChange={(e) => setCharacterInfo({...characterInfo, alignment: e.target.value})}
                />
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-red-50 rounded-lg border border-red-200 shadow-sm">
            <h2 className="text-xl font-bold mb-5 text-red-800 border-b border-red-200 pb-2">Estadísticas de Combate</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Puntos de Golpe</label>
                <div className="flex">
                  <input 
                    type="number" 
                    className="w-full p-3 border border-gray-300 rounded-l-md shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500" 
                    value={characterInfo.hp}
                    onChange={(e) => setCharacterInfo({...characterInfo, hp: parseInt(e.target.value) || 0})}
                  />
                  <span className="flex items-center justify-center px-4 bg-gray-100 border-t border-b border-gray-300">/</span>
                  <input 
                    type="number" 
                    className="w-full p-3 border border-gray-300 rounded-r-md shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500" 
                    value={characterInfo.maxHp}
                    onChange={(e) => setCharacterInfo({...characterInfo, maxHp: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Clase de Armadura</label>
                <input 
                  type="number" 
                  className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500" 
                  value={characterInfo.ac}
                  onChange={(e) => setCharacterInfo({...characterInfo, ac: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Velocidad</label>
                <input 
                  type="number" 
                  className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500" 
                  value={characterInfo.speed}
                  onChange={(e) => setCharacterInfo({...characterInfo, speed: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Iniciativa</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-gray-300 rounded-md shadow-sm bg-gray-50" 
                  value={formatModifier(getModifier(attributes.dexterity))}
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Atributos y Habilidades",
      content: (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <div className="mb-8 p-6 bg-green-50 rounded-lg border border-green-200 shadow-sm">
            <h2 className="text-xl font-bold mb-5 text-green-800 border-b border-green-200 pb-2">Atributos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries({
                'Fuerza': 'strength',
                'Destreza': 'dexterity',
                'Constitución': 'constitution',
                'Inteligencia': 'intelligence',
                'Sabiduría': 'wisdom',
                'Carisma': 'charisma'
              }).map(([label, key]) => (
                <div key={key} className="border border-green-200 p-4 rounded-lg bg-white text-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="font-bold mb-2 text-green-800">{label}</div>
                  <input 
                    type="number" 
                    className="w-full p-2 border border-gray-300 rounded-md text-center mb-3 focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                    value={attributes[key]}
                    onChange={(e) => handleAttributeChange(key, e.target.value)}
                  />
                  <div className="border rounded-full w-12 h-12 mx-auto flex items-center justify-center bg-green-50 font-bold text-green-800">
                    {formatModifier(getModifier(attributes[key]))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-6 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
            <h2 className="text-xl font-bold mb-5 text-blue-800 border-b border-blue-200 pb-2">Habilidades</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries({
                'Acrobacias': 'acrobatics',
                'Trato con Animales': 'animalHandling',
                'Arcanos': 'arcana',
                'Atletismo': 'athletics',
                'Engaño': 'deception',
                'Historia': 'history',
                'Perspicacia': 'insight',
                'Intimidación': 'intimidation',
                'Investigación': 'investigation',
                'Medicina': 'medicine',
                'Naturaleza': 'nature',
                'Percepción': 'perception',
                'Interpretación': 'performance',
                'Persuasión': 'persuasion',
                'Religión': 'religion',
                'Juego de Manos': 'sleightOfHand',
                'Sigilo': 'stealth',
                'Supervivencia': 'survival'
              }).map(([label, key]) => (
                <div key={key} className="flex items-center border border-blue-100 p-3 rounded-md bg-white shadow-sm hover:shadow-md transition-shadow">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-3" 
                    checked={skills[key]}
                    onChange={() => handleSkillToggle(key)}
                  />
                  <span className="w-8 inline-block font-bold text-blue-700 text-center">
                    {formatModifier(getSkillModifier(skillAttributes[key], skills[key]))}
                  </span>
                  <span className="ml-2 flex-grow">
                    {label} <span className="text-gray-500 text-sm">({skillAttributes[key].substring(0, 3).toUpperCase()})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Equipo y Rasgos",
      content: (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <div className="mb-8 p-6 bg-amber-50 rounded-lg border border-amber-200 shadow-sm">
            <h2 className="text-xl font-bold mb-5 text-amber-800 border-b border-amber-200 pb-2">Armas</h2>
            <div className="grid grid-cols-3 gap-4 mb-3 font-bold text-amber-900 border-b border-amber-200 pb-2">
              <div>Nombre</div>
              <div>Daño</div>
              <div>Bonificación al Ataque</div>
            </div>
            {equipment.weapons.map((weapon, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 mb-3">
                <input 
                  type="text" 
                  className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500" 
                  value={weapon.name}
                  placeholder="Nombre del arma"
                  onChange={(e) => {
                    const updatedWeapons = [...equipment.weapons];
                    updatedWeapons[index].name = e.target.value;
                    setEquipment({...equipment, weapons: updatedWeapons});
                  }}
                />
                <input 
                  type="text" 
                  className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500" 
                  value={weapon.damage}
                  placeholder="Ej: 1d8+3"
                  onChange={(e) => {
                    const updatedWeapons = [...equipment.weapons];
                    updatedWeapons[index].damage = e.target.value;
                    setEquipment({...equipment, weapons: updatedWeapons});
                  }}
                />
                <input 
                  type="text" 
                  className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500" 
                  value={formatModifier(weapon.attackBonus)}
                  placeholder="+0"
                  onChange={(e) => {
                    const updatedWeapons = [...equipment.weapons];
                    updatedWeapons[index].attackBonus = parseInt(e.target.value) || 0;
                    setEquipment({...equipment, weapons: updatedWeapons});
                  }}
                />
              </div>
            ))}
            <button 
              className="mt-2 px-4 py-2 bg-amber-600 text-white rounded-md shadow hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
              onClick={() => setEquipment({
                ...equipment, 
                weapons: [...equipment.weapons, { name: '', damage: '', attackBonus: 0 }]
              })}
            >
              + Añadir Arma
            </button>
          </div>
          
          <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold mb-5 text-gray-800 border-b border-gray-200 pb-2">Armadura</h2>
            <div className="grid grid-cols-2 gap-4 mb-3 font-bold text-gray-900 border-b border-gray-200 pb-2">
              <div>Nombre</div>
              <div>Clase de Armadura (CA)</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="text" 
                className="p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500" 
                value={equipment.armor.name}
                placeholder="Nombre de la armadura"
                onChange={(e) => setEquipment({
                  ...equipment, 
                  armor: {...equipment.armor, name: e.target.value}
                })}
              />
              <input 
                type="number" 
                className="p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500" 
                value={equipment.armor.ac}
                onChange={(e) => setEquipment({
                  ...equipment, 
                  armor: {...equipment.armor, ac: parseInt(e.target.value) || 0}
                })}
              />
            </div>
          </div>
          
          <div className="mb-8 p-6 bg-purple-50 rounded-lg border border-purple-200 shadow-sm">
            <h2 className="text-xl font-bold mb-5 text-purple-800 border-b border-purple-200 pb-2">Objetos Mágicos</h2>
            <textarea 
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500" 
              rows="4"
              placeholder="Describe tus objetos mágicos aquí..."
              value={equipment.magicItems}
              onChange={(e) => setEquipment({...equipment, magicItems: e.target.value})}
            ></textarea>
          </div>
          
          <div className="p-6 bg-indigo-50 rounded-lg border border-indigo-200 shadow-sm">
            <h2 className="text-xl font-bold mb-5 text-indigo-800 border-b border-indigo-200 pb-2">Rasgos y Talentos</h2>
            <textarea 
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
              rows="4"
              placeholder="Describe tus rasgos, habilidades especiales y talentos aquí..."
              value={equipment.traits}
              onChange={(e) => setEquipment({...equipment, traits: e.target.value})}
            ></textarea>
          </div>
        </div>
      )
    },
    {
      title: "Hechizos",
      content: (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <div className="mb-8 p-6 bg-violet-50 rounded-lg border border-violet-200 shadow-sm">
            <h2 className="text-xl font-bold mb-5 text-violet-800 border-b border-violet-200 pb-2">Espacios de Conjuro</h2>
            <div className="flex items-center">
              <label className="mr-3 font-medium">Disponibles:</label>
              <input 
                type="number" 
                className="w-20 p-3 border border-gray-300 rounded-l-md shadow-sm text-center focus:ring-2 focus:ring-violet-500 focus:border-violet-500" 
                value={spells.slots.used}
                onChange={(e) => setSpells({
                  ...spells, 
                  slots: {...spells.slots, used: parseInt(e.target.value) || 0}
                })}
              />
              <span className="mx-3 text-lg font-bold text-violet-800">/</span>
              <input 
                type="number" 
                className="w-20 p-3 border border-gray-300 rounded-r-md shadow-sm text-center focus:ring-2 focus:ring-violet-500 focus:border-violet-500" 
                value={spells.slots.total}
                onChange={(e) => setSpells({
                  ...spells, 
                  slots: {...spells.slots, total: parseInt(e.target.value) || 0}
                })}
              />
            </div>
          </div>
          
          <div className="p-6 bg-fuchsia-50 rounded-lg border border-fuchsia-200 shadow-sm">
            <h2 className="text-xl font-bold mb-5 text-fuchsia-800 border-b border-fuchsia-200 pb-2">Hechizos Conocidos</h2>
            <div className="grid grid-cols-3 gap-4 mb-3 font-bold text-fuchsia-900 border-b border-fuchsia-200 pb-2">
              <div>Nombre</div>
              <div>Nivel</div>
              <div>Descripción</div>
            </div>
            {spells.spellList.map((spell, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 mb-3">
                <input 
                  type="text" 
                  className="p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500" 
                  value={spell.name}
                  placeholder="Nombre del hechizo"
                  onChange={(e) => {
                    const updatedSpells = [...spells.spellList];
                    updatedSpells[index].name = e.target.value;
                    setSpells({...spells, spellList: updatedSpells});
                  }}
                />
                <input 
                  type="number" 
                  className="p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500" 
                  value={spell.level}
                  onChange={(e) => {
                    const updatedSpells = [...spells.spellList];
                    updatedSpells[index].level = parseInt(e.target.value) || 0;
                    setSpells({...spells, spellList: updatedSpells});
                  }}
                />
                <input 
                  type="text" 
                  className="p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500" 
                  value={spell.description}
                  placeholder="Efecto del hechizo"
                  onChange={(e) => {
                    const updatedSpells = [...spells.spellList];
                    updatedSpells[index].description = e.target.value;
                    setSpells({...spells, spellList: updatedSpells});
                  }}
                />
              </div>
            ))}
            <button 
              className="mt-2 px-4 py-2 bg-fuchsia-600 text-white rounded-md shadow hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 transition-colors"
              onClick={() => setSpells({
                ...spells, 
                spellList: [...spells.spellList, { name: '', level: 0, description: '' }]
              })}
            >
              + Añadir Hechizo
            </button>
          </div>
        </div>
      )
    }
  ];
  
  // Función para renderizar el botón de guardar
  const renderSaveButton = () => (
    <div className="mt-8 text-center">
      <button
        onClick={saveCharacter}
        disabled={saving}
        className="px-8 py-3 bg-emerald-600 text-white rounded-md shadow-md hover:bg-emerald-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors font-bold"
      >
        {saving ? 'Guardando...' : 'Guardar Personaje'}
      </button>
    </div>
  );
  
  return (
    <div className="max-w-7xl mx-auto bg-gradient-to-r from-gray-50 to-gray-100 p-6 md:p-8 rounded-xl shadow-lg">
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Cargando personaje...</p>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Hoja de Personaje D&D 5e</h1>
          
          {/* Tabs */}
          <div className="flex flex-wrap border-b border-gray-300 mb-6">
            {tabs.map((tab, index) => (
              <button
                key={index}
                className={`py-3 px-6 font-medium text-lg transition-colors ${
                  activeTab === index 
                    ? 'text-emerald-700 border-b-2 border-emerald-600 -mb-px bg-white rounded-t-lg' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-t-lg'
                }`}
                onClick={() => setActiveTab(index)}
              >
                {tab.title}
              </button>
            ))}
          </div>
          
          {/* Active Tab Content */}
          {tabs[activeTab].content}
          
          {/* Save Button */}
          {renderSaveButton()}
        </>
      )}
    </div>
  );
};

export default CharacterSheet;