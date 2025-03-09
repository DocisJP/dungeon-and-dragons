import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

const DnDCharacterSheet = ({ 
  characterId, 
  onCharacterSaved,
  initialData = {
    attributes: {
      strength: 10,
      dexterity: 10,
      constitution: 10, 
      intelligence: 10,
      wisdom: 10,
      charisma: 10
    },
    info: {
      name: '',
      class: '',
      level: 1,
      race: '',
      background: '',
      alignment: ''
    }
  } 
}) => {
  const [activeTab, setActiveTab] = useState("info");
  const [attributes, setAttributes] = useState(initialData.attributes);
  const [characterInfo, setCharacterInfo] = useState(initialData.info);

  // Función para calcular el modificador basado en el valor del atributo
  const getModifier = (value) => {
    return Math.floor((value - 10) / 2);
  };

  // Función para formatear el modificador con + o -
  const formatModifier = (mod) => {
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const handleAttributeChange = (attr, value) => {
    setAttributes(prev => ({
      ...prev,
      [attr]: parseInt(value) || 0
    }));
  };

  const handleInfoChange = (field, value) => {
    setCharacterInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveCharacter = () => {
    const characterData = {
      id: characterId,
      attributes,
      info: characterInfo,
    };
    
    console.log('Saving character:', characterData);
    onCharacterSaved && onCharacterSaved(characterData);
  };

  // Estilo común para cada sección de contenido para mantener consistencia
  const contentStyle = "bg-white p-6 rounded-md mb-4 min-h-[400px]";

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="dnd-card dnd-border mb-6">
        <div className="p-6">
          <h1 className="dnd-heading text-3xl mb-6 text-center">Hoja de Personaje</h1>
          
          <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Mejorar el espaciado entre pestañas */}
            <TabsList className="grid grid-cols-4 gap-2 mb-6">
              <TabsTrigger 
                value="info" 
                className="text-lg py-3"
              >
                Información
              </TabsTrigger>
              <TabsTrigger 
                value="attributes" 
                className="text-lg py-3"
              >
                Atributos
              </TabsTrigger>
              <TabsTrigger 
                value="skills" 
                className="text-lg py-3"
              >
                Habilidades
              </TabsTrigger>
              <TabsTrigger 
                value="equipment" 
                className="text-lg py-3"
              >
                Equipo
              </TabsTrigger>
            </TabsList>
            
            {/* Sección de Información */}
            <TabsContent value="info" className={contentStyle}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-lg font-medium mb-2 dnd-heading">Nombre</label>
                    <Input 
                      className="dnd-input" 
                      value={characterInfo.name}
                      onChange={(e) => handleInfoChange('name', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-lg font-medium mb-2 dnd-heading">Clase</label>
                    <Input 
                      className="dnd-input" 
                      value={characterInfo.class}
                      onChange={(e) => handleInfoChange('class', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-lg font-medium mb-2 dnd-heading">Nivel</label>
                    <Input 
                      className="dnd-input" 
                      type="number" 
                      min="1" 
                      value={characterInfo.level}
                      onChange={(e) => handleInfoChange('level', parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-lg font-medium mb-2 dnd-heading">Raza</label>
                    <Input 
                      className="dnd-input" 
                      value={characterInfo.race}
                      onChange={(e) => handleInfoChange('race', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-lg font-medium mb-2 dnd-heading">Trasfondo</label>
                    <Input 
                      className="dnd-input" 
                      value={characterInfo.background}
                      onChange={(e) => handleInfoChange('background', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-lg font-medium mb-2 dnd-heading">Alineamiento</label>
                    <Input 
                      className="dnd-input" 
                      value={characterInfo.alignment}
                      onChange={(e) => handleInfoChange('alignment', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-lg font-medium mb-2 dnd-heading">Descripción y notas</label>
                <Textarea 
                  className="dnd-input" 
                  rows={5}
                  placeholder="Describe a tu personaje, su historia, apariencia, personalidad..."
                />
              </div>
            </TabsContent>
            
            {/* Sección de Atributos */}
            <TabsContent value="attributes" className={contentStyle}>
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 dnd-heading">Atributos Principales</h2>
                <div className="dnd-stats mb-6">
                  {Object.entries(attributes).map(([attr, value]) => (
                    <div key={attr} className="dnd-stat-box dnd-border p-4">
                      <span className="dnd-stat-label mb-2">{attr.charAt(0).toUpperCase() + attr.slice(1)}</span>
                      <Input 
                        className="dnd-input text-center mb-2 w-20" 
                        type="number" 
                        value={value}
                        onChange={(e) => handleAttributeChange(attr, e.target.value)}
                      />
                      <span className="dnd-stat-modifier">{formatModifier(getModifier(value))}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-4 dnd-heading">Estadísticas Derivadas</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="dnd-stat-box dnd-border p-4">
                    <span className="dnd-stat-label mb-2">Puntos de Golpe</span>
                    <div className="flex items-center gap-3 mt-2">
                      <Input className="dnd-input w-20 text-center" type="number" defaultValue="10" />
                      <span className="text-xl">/</span>
                      <Input className="dnd-input w-20 text-center" type="number" defaultValue="10" />
                    </div>
                  </div>
                  
                  <div className="dnd-stat-box dnd-border p-4">
                    <span className="dnd-stat-label mb-2">Clase de Armadura</span>
                    <Input className="dnd-input w-20 text-center mt-2" type="number" defaultValue="10" />
                  </div>
                  
                  <div className="dnd-stat-box dnd-border p-4">
                    <span className="dnd-stat-label mb-2">Iniciativa</span>
                    <span className="dnd-stat-value mt-2">{formatModifier(getModifier(attributes.dexterity))}</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Sección de Habilidades */}
            <TabsContent value="skills" className={contentStyle}>
              <h2 className="text-2xl font-bold mb-4 dnd-heading">Habilidades</h2>
              <Table className="dnd-table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Habilidad</TableHead>
                    <TableHead className="w-1/6">Atributo</TableHead>
                    <TableHead className="w-1/6">Competente</TableHead>
                    <TableHead className="w-1/3">Modificador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Acrobacias</TableCell>
                    <TableCell>DES</TableCell>
                    <TableCell><Checkbox /></TableCell>
                    <TableCell>{formatModifier(getModifier(attributes.dexterity))}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Arcanos</TableCell>
                    <TableCell>INT</TableCell>
                    <TableCell><Checkbox /></TableCell>
                    <TableCell>{formatModifier(getModifier(attributes.intelligence))}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Atletismo</TableCell>
                    <TableCell>FUE</TableCell>
                    <TableCell><Checkbox /></TableCell>
                    <TableCell>{formatModifier(getModifier(attributes.strength))}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Engaño</TableCell>
                    <TableCell>CAR</TableCell>
                    <TableCell><Checkbox /></TableCell>
                    <TableCell>{formatModifier(getModifier(attributes.charisma))}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Historia</TableCell>
                    <TableCell>INT</TableCell>
                    <TableCell><Checkbox /></TableCell>
                    <TableCell>{formatModifier(getModifier(attributes.intelligence))}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Percepción</TableCell>
                    <TableCell>SAB</TableCell>
                    <TableCell><Checkbox /></TableCell>
                    <TableCell>{formatModifier(getModifier(attributes.wisdom))}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TabsContent>
            
            {/* Sección de Equipo */}
            <TabsContent value="equipment" className={contentStyle}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="dnd-heading text-xl mb-4">Armas</h3>
                  <Table className="dnd-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Daño</TableHead>
                        <TableHead>Tipo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell><Input className="dnd-input" placeholder="Espada larga" /></TableCell>
                        <TableCell><Input className="dnd-input" placeholder="1d8" /></TableCell>
                        <TableCell><Input className="dnd-input" placeholder="Cortante" /></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><Input className="dnd-input" placeholder="Arco corto" /></TableCell>
                        <TableCell><Input className="dnd-input" placeholder="1d6" /></TableCell>
                        <TableCell><Input className="dnd-input" placeholder="Perforante" /></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                
                <div>
                  <h3 className="dnd-heading text-xl mb-4">Objetos</h3>
                  <ScrollArea className="h-[200px] border rounded p-2">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input className="dnd-input flex-grow" placeholder="Poción de curación" />
                        <Input className="dnd-input w-16" type="number" defaultValue="2" min="0" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Input className="dnd-input flex-grow" placeholder="Cuerda (50 pies)" />
                        <Input className="dnd-input w-16" type="number" defaultValue="1" min="0" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Input className="dnd-input flex-grow" placeholder="Antorcha" />
                        <Input className="dnd-input w-16" type="number" defaultValue="5" min="0" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Input className="dnd-input flex-grow" placeholder="Raciones (1 día)" />
                        <Input className="dnd-input w-16" type="number" defaultValue="10" min="0" />
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              </div>
              
              <div>
                <h3 className="dnd-heading text-xl mb-4">Monedas</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="w-24">
                    <label className="block dnd-stat-label mb-2">Platino</label>
                    <Input className="dnd-input text-center" type="number" defaultValue="0" min="0" />
                  </div>
                  <div className="w-24">
                    <label className="block dnd-stat-label mb-2">Oro</label>
                    <Input className="dnd-input text-center" type="number" defaultValue="25" min="0" />
                  </div>
                  <div className="w-24">
                    <label className="block dnd-stat-label mb-2">Plata</label>
                    <Input className="dnd-input text-center" type="number" defaultValue="30" min="0" />
                  </div>
                  <div className="w-24">
                    <label className="block dnd-stat-label mb-2">Cobre</label>
                    <Input className="dnd-input text-center" type="number" defaultValue="42" min="0" />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-8 text-center">
            <Button 
              onClick={saveCharacter} 
              className="dnd-button px-10 py-3 text-lg"
            >
              Guardar Personaje
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DnDCharacterSheet; 