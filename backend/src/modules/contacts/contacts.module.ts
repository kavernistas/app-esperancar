import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { AuditModule } from '../audit/audit.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [AuditModule, EventsModule],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}
