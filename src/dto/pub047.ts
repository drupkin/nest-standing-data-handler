import { Expose } from 'class-transformer';

export class S0 {
  interfaceID: string;
  schemaVersion: string;
  eventCode: string;
}

export class S1 {
  environmentTag: string;
  subText: string;
  senderUniqueReference: string;
  senderTimestamp: string;
  senderDIPID: string;
  senderRoleID: string;
  senderCorrelationID: string;
  DIPConnectionProviderID: string;
}

export class A0 {
  primaryRecipients: string[];
  secondaryRecipients: string[];
  always: string[];
}

export class D0 {
  transactionID: string;
  transactionTimestamp: string;
  publicationID: string;
  initialCorrelationID: string;
  replayIndicator: boolean;
  serviceTicketURL: string;
}

export class CommonBlock {
  S0: S0;
  S1: S1;
  A0: A0;
  D0: D0;
}

export class P01 {
  publicationDescription: string;
  publicationVersionID: string;
  publicationDate: string;
}

export class P02 {
  distributionVariantID: string;
  distributionVariantName: string;
  distributionVariantDescription: string;
  distributionVariantVersionID: string;
  distributionVariantPublicationDate: string;
  distributionVariantFormat: string;
  distributionDeliveryFormat: string;
  @Expose()
  distributionDeliveryURI: string;
  additionalInformation: string;
}

export class CustomBlock {
  @Expose()
  P01: P01;
  @Expose()
  P02List: P02[];
}

export class Pub047 {
  @Expose()
  CommonBlock: CommonBlock;
  @Expose()
  CustomBlock: CustomBlock;
}
