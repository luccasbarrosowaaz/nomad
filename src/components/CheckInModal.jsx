import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import CheckInForm from './checkin/CheckInForm';

const CheckInModal = ({ isOpen, setIsOpen, onCheckInSuccess, existingLocation }) => {
  const isUpdateMode = !!existingLocation;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isUpdateMode ? 'Atualizar Informações do Local' : 'Registrar um Novo Local de Check-in'}</DialogTitle>
          <DialogDescription>
            {isUpdateMode ? 'Edite os dados abaixo para manter as informações do local sempre atualizadas.' : 'Compartilhe um lugar incrível com a comunidade.'}
          </DialogDescription>
        </DialogHeader>
        <CheckInForm 
          existingLocation={existingLocation}
          onCheckInSuccess={onCheckInSuccess}
          setIsOpen={setIsOpen}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CheckInModal;