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

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="dnd-card dnd-border mb-6">
        <div className="p-6">
          <h1 className="dnd-heading text-3xl mb-6 text-center">Hoja de Personaje</h1>
          
          <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="info" className="text-lg">Información</TabsTrigger>
              <TabsTrigger value="attributes" className="text-lg">Atributos</TabsTrigger>
              <TabsTrigger value="skills" className="text-lg">Habilidades</TabsTrigger>
              <TabsTrigger value="equipment" className="text-lg">Equipo</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dnd-heading text-base">Nombre</label>
                  <Input 
                    className="dnd-input mb-4" 
                    value={characterInfo.name}
                    onChange={(e) => handleInfoChange('name', e.target.value)}
                  />
                  
                  <label className="block text-sm font-medium mb-1 dnd-heading text-base">Clase</label>
                  <Input 
                    className="dnd-input mb-4" 
                    value={characterInfo.class}
                    onChange={(e) => handleInfoChange('class', e.target.value)}
                  />
                  
                  <label className="block text-sm font-medium mb-1 dnd-heading text-base">Nivel</label>
                  <Input 
                    className="dnd-input mb-4" 
                    type="number" 
                    min="1" 
                    value={characterInfo.level}
                    onChange={(e) => handleInfoChange('level', parseInt(e.target.value) || 1)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 dnd-heading text-base">Raza</label>
                  <Input 
                    className="dnd-input mb-4" 
                    value={characterInfo.race}
                    onChange={(e) => handleInfoChange('race', e.target.value)}
                  />
                  
                  <label className="block text-sm font-medium mb-1 dnd-heading text-base">Trasfondo</label>
                  <Input 
                    className="dnd-input mb-4" 
                    value={characterInfo.background}
                    onChange={(e) => handleInfoChange('background', e.target.value)}
                  />
                  
                  <label className="block text-sm font-medium mb-1 dnd-heading text-base">Alineamiento</label>
                  <Input 
                    className="dnd-input mb-4" 
                    value={characterInfo.alignment}
                    onChange={(e) => handleInfoChange('alignment', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 dnd-heading text-base">Descripción y notas</label>
                <Textarea 
                  className="dnd-input" 
                  rows={5}
                  placeholder="Describe a tu personaje, su historia, apariencia, personalidad..."
                />
              </div>
            </TabsContent>
            
            <TabsContent value="attributes" className="space-y-4">
              <div className="dnd-stats mb-6">
                {Object.entries(attributes).map(([attr, value]) => (
                  <div key={attr} className="dnd-stat-box dnd-border">
                    <span className="dnd-stat-label mb-1">{attr.charAt(0).toUpperCase() + attr.slice(1)}</span>
                    <Input 
                      className="dnd-input text-center mb-2 w-16" 
                      type="number" 
                      value={value}
                      onChange={(e) => handleAttributeChange(attr, e.target.value)}
                    />
                    <span className="dnd-stat-modifier">{formatModifier(getModifier(value))}</span>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="dnd-stat-box dnd-border">
                  <span className="dnd-stat-label">Puntos de Golpe</span>
                  <div className="flex items-center gap-2 mt-2">
                    <Input className="dnd-input w-16 text-center" type="number" defaultValue="10" />
                    <span>/</span>
                    <Input className="dnd-input w-16 text-center" type="number" defaultValue="10" />
                  </div>
                </div>
                
                <div className="dnd-stat-box dnd-border">
                  <span className="dnd-stat-label">Clase de Armadura</span>
                  <Input className="dnd-input w-16 text-center mt-2" type="number" defaultValue="10" />
                </div>
                
                <div className="dnd-stat-box dnd-border">
                  <span className="dnd-stat-label">Iniciativa</span>
                  <span className="dnd-stat-value mt-2">{formatModifier(getModifier(attributes.dexterity))}</span>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="skills" className="space-y-4">
              <Table className="dnd-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Habilidad</TableHead>
                    <TableHead>Atributo</TableHead>
                    <TableHead>Competente</TableHead>
                    <TableHead>Modificador</TableHead>
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
                  {/* Añadir más filas de habilidades aquí */}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="equipment" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2 p-2">
                      <div className="flex items-center">
                        <Input className="dnd-input flex-grow mr-2" placeholder="Poción de curación" />
                        <Input className="dnd-input w-16" type="number" defaultValue="2" min="0" />
                      </div>
                      <div className="flex items-center">
                        <Input className="dnd-input flex-grow mr-2" placeholder="Cuerda (50 pies)" />
                        <Input className="dnd-input w-16" type="number" defaultValue="1" min="0" />
                      </div>
                      <div className="flex items-center">
                        <Input className="dnd-input flex-grow mr-2" placeholder="Antorcha" />
                        <Input className="dnd-input w-16" type="number" defaultValue="5" min="0" />
                      </div>
                      <div className="flex items-center">
                        <Input className="dnd-input flex-grow mr-2" placeholder="Raciones (1 día)" />
                        <Input className="dnd-input w-16" type="number" defaultValue="10" min="0" />
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              </div>
              
              <div>
                <h3 className="dnd-heading text-xl mb-4">Monedas</h3>
                <div className="flex space-x-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 dnd-stat-label">Platino</label>
                    <Input className="dnd-input w-16" type="number" defaultValue="0" min="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dnd-stat-label">Oro</label>
                    <Input className="dnd-input w-16" type="number" defaultValue="25" min="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dnd-stat-label">Plata</label>
                    <Input className="dnd-input w-16" type="number" defaultValue="30" min="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dnd-stat-label">Cobre</label>
                    <Input className="dnd-input w-16" type="number" defaultValue="42" min="0" />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center">
            <Button 
              onClick={saveCharacter} 
              className="dnd-button px-8 py-2"
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